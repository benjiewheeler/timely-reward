#include <eosio/asset.hpp>
#include <eosio/eosio.hpp>
#include <eosio/singleton.hpp>

using namespace eosio;

CONTRACT timelyreward : public contract
{
public:
    using contract::contract;

    // ------------ admin actions ------------

    // pause/unpause the contract
    ACTION setpaused(const bool& paused);

    // configure the token used for rewards
    ACTION settoken(const name& token_contract, const symbol& token_symbol);

    // configure a new reward for the specified users
    ACTION addreward(const std::vector<name>& recipients, const asset& quantity, const time_point_sec& unlock_start, const uint16_t unlock_days);

private:
    // token stat struct
    // taken from the reference eosio.token contract
    struct stat_s {
        asset supply;
        asset max_supply;
        name issuer;

        uint64_t primary_key() const { return supply.symbol.code().raw(); }
    };

    TABLE config
    {
        bool paused = false;
        name token_contract = name("eosio.token");
        symbol token_symbol = symbol(symbol_code("WAX"), 8);
    };

    TABLE rewards_s
    {
        name user;
        asset remaining_rewards;
        time_point_sec unlock_start;
        uint16_t unlock_days;
        time_point_sec last_claim;

        uint64_t primary_key() const { return user.value; }
    };

    typedef multi_index<name("stat"), stat_s> stat_t;

    typedef multi_index<name("rewards"), rewards_s> rewards_t;
    typedef singleton<name("config"), config> config_t;
};