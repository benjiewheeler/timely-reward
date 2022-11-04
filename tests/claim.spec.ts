import { TimePointSec } from "@greymass/eosio";
import { Blockchain, mintTokens } from "@proton/vert";
import chai, { assert } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

const blockchain = new Blockchain();
const [alice, bob] = blockchain.createAccounts("alice", "bob");
const timelyRewardContract = blockchain.createContract("timelyreward", "contract/timelyreward");
const testTokenContract = blockchain.createContract("test.token", "node_modules/proton-tsc/external/eosio.token/eosio.token");

describe("claim", () => {
	before(async () => {
		blockchain.resetTables();

		// set the blockchain time for config
		blockchain.setTime(TimePointSec.fromDate(new Date("2022-01-01T00:00:00.000Z")));

		// create some tokens for rewarding testers
		await mintTokens(testTokenContract, "BTC", 8, 21e6, 10000, [timelyRewardContract]);

		// unpause the contract; to populate the config table
		await timelyRewardContract.actions.setpaused([false]).send();

		// set the reward token
		await timelyRewardContract.actions.settoken(["test.token", "8,BTC"]).send();

		// set some rewards for test users
		await timelyRewardContract.actions.addreward([[alice.name], "1000.00000000 BTC", "2022-01-02T00:00:00", 7]).send();
	});

	it("require user auth", async () => {
		await assert.isRejected(
			timelyRewardContract.actions.claim([alice.name]).send("bob@active"),
			"user (" + alice.name + ") has not authorized this action"
		);
	});

	it("reject user with no rewards", async () => {
		await assert.isRejected(
			timelyRewardContract.actions.claim([bob.name]).send("bob@active"),
			"user (" + bob.name + ") has no rewards to claim"
		);
	});

	it("reject claiming before unlock", async () => {
		await assert.isRejected(
			timelyRewardContract.actions.claim([alice.name]).send("alice@active"),
			"rewards for user (" + alice.name + ") are not unlocked yet"
		);
	});

	it("claim partial rewards", async () => {
		// set the blockchain time for partial claiming
		// 10 hours after reward unlock start
		blockchain.setTime(TimePointSec.fromDate(new Date("2022-01-02T10:00:00.000Z")));

		await assert.isFulfilled(timelyRewardContract.actions.claim([alice.name]).send("alice@active"));
	});

	it("rewards table after claim", async () => {
		const row = await timelyRewardContract.tables.rewards(timelyRewardContract.name.value.value).getTableRow(alice.name.value.value);

		assert.deepEqual(row, {
			user: alice.name.toString(),
			remaining_rewards: "940.47619048 BTC",
			unlock_start: "2022-01-02T00:00:00",
			daily_rate: "142.85714285 BTC",
			last_claim: "2022-01-02T10:00:00",
		});
	});

	it("claim full rewards", async () => {
		// set the blockchain time for full claiming
		// more than 7 days after reward unlock start
		blockchain.setTime(TimePointSec.fromDate(new Date("2022-01-10T10:00:00.000Z")));

		await assert.isFulfilled(timelyRewardContract.actions.claim([alice.name]).send("alice@active"));
	});

	it("rewards table after claim", async () => {
		const row = await timelyRewardContract.tables.rewards(timelyRewardContract.name.value.value).getTableRow(alice.name.value.value);

		assert.deepEqual(row, undefined);
	});
});
