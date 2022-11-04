#include <timelyreward.hpp>

ACTION timelyreward::setpaused(const bool& paused)
{
    // check contract auth
    check(has_auth(get_self()), "this action is restricted to admin only");

    // get the config table instance
    config_t config_tbl(get_self(), get_self().value);

    // get the current config or create a new one
    auto conf = config_tbl.get_or_default(config {});

    // set is paused
    conf.paused = paused;

    // save the new config
    config_tbl.set(conf, get_self());
}

ACTION timelyreward::settoken(const name& token_contract, const symbol& token_symbol)
{
    // check contract auth
    check(has_auth(get_self()), "this action is restricted to admin only");

    // check if the contract exists
    check(is_account(token_contract), "contract account does not exist");

    // check if the contract has a token and is valid
    stat_t stat_tbl(token_contract, token_symbol.code().raw());
    stat_tbl.require_find(token_symbol.code().raw(), "token symbol does not exist");

    // get config table instance
    config_t conf_tbl(get_self(), get_self().value);

    // get/create current config
    auto conf = conf_tbl.get_or_default(config {});

    // get the current config or create a new one
    conf.token_contract = token_contract;
    conf.token_symbol = token_symbol;

    // save the new config
    conf_tbl.set(conf, get_self());
}

ACTION timelyreward::addreward(const std::vector<name>& recipients, const asset& quantity, const time_point_sec& unlock_start, const uint16_t unlock_days)
{
    // check contract auth
    check(has_auth(get_self()), "this action is restricted to admin only");

    // check if the recipients list is not empty
    check(recipients.size() > 0, "you must add at least 1 reward recipient");

    // check if quantity is valid
    check(quantity.is_valid(), "invalid quantity");
    check(quantity.amount > 0, "quantity amount must be positive");

    // check if unlock_start is valid
    check(unlock_start > current_time_point(), "unlock start must be in the future");

    // check if unlock_days is valid
    check(unlock_days > 0, "unlock period must be a positive integer");

    // get config table instance
    config_t conf_tbl(get_self(), get_self().value);

    // check if the contract is initialized
    check(conf_tbl.exists(), "smart contract hasn't been initialized yet; call setpaused first");

    // get current config
    auto conf = conf_tbl.get();

    // check if the contract is not paused
    check(!conf.paused, "the contract is currently paused");

    // check if quantity's symbol is valid
    check(quantity.symbol == conf.token_symbol, "token symbol mismatch");

    // get the rewards table instance
    rewards_t rewards_tbl(get_self(), get_self().value);

    for (auto& user : recipients) {
        // check if the user doesn't have rewards configured already
        const auto& user_itr = rewards_tbl.find(user.value);

        if (user_itr != rewards_tbl.end()) {
            check(false, std ::string("recipient (" + user.to_string() + ") already has rewards configured").c_str());
        }

        // add the rewards row to the table
        rewards_tbl.emplace(get_self(), [&](rewards_s& row) {
            row.user = user;
            row.remaining_rewards = quantity;
            row.unlock_start = unlock_start;
            row.unlock_days = unlock_days;
            row.last_claim = unlock_start;
        });
    }
}