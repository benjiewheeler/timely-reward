import { Blockchain, mintTokens, nameToBigInt } from "@proton/vert";
import chai, { assert } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const blockchain = new Blockchain();
const [alice, bob] = blockchain.createAccounts("alice", "bob");
const timelyRewardContract = blockchain.createContract("ezstake", "contract/timelyreward");
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

		it("require contract auth", () => {
			return assert.isRejected(
				timelyRewardContract.actions.setpaused([true]).send("alice@active"),
				"this action is restricted to admin only"
			);
		});

		it("pause the contract", () => {
			return assert.isFulfilled(timelyRewardContract.actions.setpaused([true]).send());
		});

		it("config table paused=true", async () => {
			const rows = await timelyRewardContract.tables.config(timelyRewardContract.name.value.value).getTableRows();

			assert.deepEqual(rows, [{ ...DEFAULT_CONFIG_ROW, paused: true }]);
		});

		it("unpause the contract", () => {
			return assert.isFulfilled(timelyRewardContract.actions.setpaused([false]).send());
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

		it("require contract auth", () => {
			return assert.isRejected(
				timelyRewardContract.actions.settoken(["eosio.token", "8,WAX"]).send("alice@active"),
				"this action is restricted to admin only"
			);
		});

		it("config initial state", async () => {
			const rows = await timelyRewardContract.tables.config(timelyRewardContract.name.value.value).getTableRows();
			assert.deepEqual(rows, [DEFAULT_CONFIG_ROW]);
		});

		it("set the config", async () => {
			return assert.isFulfilled(timelyRewardContract.actions.settoken(["test.token", "8,BTC"]).send());
		});

		it("config after setting the token", async () => {
			const rows = await timelyRewardContract.tables.config(timelyRewardContract.name.value.value).getTableRows();
			assert.deepEqual(rows, [{ ...DEFAULT_CONFIG_ROW, token_contract: "test.token", token_symbol: "8,BTC" }]);
		});

		it("disallow non-existing contracts", () => {
			return assert.isRejected(timelyRewardContract.actions.settoken(["dummy", "8,WAX"]).send(), "contract account does not exist");
		});

		it("disallow non-token contracts", () => {
			return assert.isRejected(timelyRewardContract.actions.settoken(["alice", "8,WAX"]).send(), "token symbol does not exist");
		});

		it("disallow non-existing tokens", () => {
			return assert.isRejected(timelyRewardContract.actions.settoken(["test.token", "4,EOS"]).send(), "token symbol does not exist");
		});
	});
});
