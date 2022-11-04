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