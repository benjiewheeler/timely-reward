import { TimePointSec } from "@greymass/eosio";
import { Blockchain, mintTokens } from "@proton/vert";
import chai, { assert } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const blockchain = new Blockchain();
const [alice, bob] = blockchain.createAccounts("alice", "bob");
const timelyRewardContract = blockchain.createContract("timelyreward", "contract/timelyreward");
const testTokenContract = blockchain.createContract("test.token", "node_modules/proton-tsc/external/eosio.token/eosio.token");

const DEFAULT_CONFIG_ROW = {
	paused: false,
	token_contract: "eosio.token",
	token_symbol: "8,WAX",
};

describe("config", () => {
	describe("pause", () => {
		before(() => {
			blockchain.resetTables();
		});

		it("require contract auth", async () => {
			await assert.isRejected(
				timelyRewardContract.actions.setpaused([true]).send("alice@active"),
				"this action is restricted to admin only"
			);
		});

		it("pause the contract", async () => {
			await assert.isFulfilled(timelyRewardContract.actions.setpaused([true]).send());
		});

		it("config table paused=true", async () => {
			const rows = await timelyRewardContract.tables.config(timelyRewardContract.name.value.value).getTableRows();

			assert.deepEqual(rows, [{ ...DEFAULT_CONFIG_ROW, paused: true }]);
		});

		it("unpause the contract", async () => {
			await assert.isFulfilled(timelyRewardContract.actions.setpaused([false]).send());
		});

		it("config table paused=false", async () => {
			const rows = await timelyRewardContract.tables.config(timelyRewardContract.name.value.value).getTableRows();

			assert.deepEqual(rows, [{ ...DEFAULT_CONFIG_ROW, paused: false }]);
		});
	});

	describe("set token", () => {
		before(async () => {
			blockchain.resetTables();

			// create some tokens for testing
			await mintTokens(testTokenContract, "BTC", 8, 21e6, 5, []);

			// unpause the contract; just to populate the config table
			await timelyRewardContract.actions.setpaused([false]).send();
		});

		it("require contract auth", async () => {
			await assert.isRejected(
				timelyRewardContract.actions.settoken(["eosio.token", "8,WAX"]).send("alice@active"),
				"this action is restricted to admin only"
			);
		});

		it("config initial state", async () => {
			const rows = await timelyRewardContract.tables.config(timelyRewardContract.name.value.value).getTableRows();
			assert.deepEqual(rows, [DEFAULT_CONFIG_ROW]);
		});

		it("set the config", async () => {
			await assert.isFulfilled(timelyRewardContract.actions.settoken(["test.token", "8,BTC"]).send());
		});

		it("config after setting the token", async () => {
			const rows = await timelyRewardContract.tables.config(timelyRewardContract.name.value.value).getTableRows();
			assert.deepEqual(rows, [{ ...DEFAULT_CONFIG_ROW, token_contract: "test.token", token_symbol: "8,BTC" }]);
		});

		it("disallow non-existing contracts", async () => {
			await assert.isRejected(timelyRewardContract.actions.settoken(["dummy", "8,WAX"]).send(), "contract account does not exist");
		});

		it("disallow non-token contracts", async () => {
			await assert.isRejected(timelyRewardContract.actions.settoken(["alice", "8,WAX"]).send(), "token symbol does not exist");
		});

		it("disallow non-existing tokens", async () => {
			await assert.isRejected(timelyRewardContract.actions.settoken(["test.token", "4,EOS"]).send(), "token symbol does not exist");
		});
	});

	describe("add users", () => {
		before(async () => {
			blockchain.resetTables();

			// set the blockchain time
			blockchain.setTime(TimePointSec.fromDate(new Date("2022-01-01T00:00:00.000Z")));

			// unpause the contract; just to populate the config table
			await timelyRewardContract.actions.setpaused([false]).send();
		});

		it("require contract auth", async () => {
			await assert.isRejected(
				timelyRewardContract.actions
					.addreward([[alice.name.toString()], "1000.00000000 WAX", "2022-01-02T00:00:00", 7])
					.send("alice@active"),
				"this action is restricted to admin only"
			);
		});

		it("reject empty recipients list", async () => {
			await assert.isRejected(
				timelyRewardContract.actions.addreward([[], "1000.00000000 WAX", "2022-01-02T00:00:00", 7]).send(),
				"you must add at least 1 reward recipient"
			);
		});

		it("reject invalid quantity", async () => {
			await assert.isRejected(
				timelyRewardContract.actions.addreward([[alice.name.toString()], "46116860200.00000000 WAX", "2022-01-02T00:00:00", 7]).send(),
				"invalid quantity"
			);

			await assert.isRejected(
				timelyRewardContract.actions.addreward([[alice.name.toString()], "-10.00000000 WAX", "2022-01-02T00:00:00", 7]).send(),
				"quantity amount must be positive"
			);
		});

		it("reject unlock start in the past", async () => {
			await assert.isRejected(
				timelyRewardContract.actions.addreward([[alice.name.toString()], "1000.00000000 WAX", "2020-01-02T00:00:00", 7]).send(),
				"unlock start must be in the future"
			);
		});

		it("reject invalid unlock", async () => {
			await assert.isRejected(
				timelyRewardContract.actions.addreward([[alice.name.toString()], "1000.00000000 WAX", "2022-01-02T00:00:00", 0]).send(),
				"unlock period must be a positive integer"
			);
		});

		it("reject mismatched token symbol", async () => {
			await assert.isRejected(
				timelyRewardContract.actions.addreward([[alice.name.toString()], "1000.0000 TLM", "2022-01-02T00:00:00", 7]).send(),
				"token symbol mismatch"
			);
		});

		it("add alice to receive rewards", async () => {
			await assert.isFulfilled(
				timelyRewardContract.actions.addreward([[alice.name.toString()], "1000.00000000 WAX", "2022-01-02T00:00:00", 7]).send()
			);
		});

		it("reject adding duplicate user", async () => {
			await assert.isRejected(
				timelyRewardContract.actions.addreward([[alice.name.toString()], "1000.00000000 WAX", "2022-01-02T00:00:00", 7]).send(),
				"recipient (" + alice.name.toString() + ") already has rewards configured"
			);
		});
	});
});
