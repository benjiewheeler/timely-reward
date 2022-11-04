# Timely Reward

Configurable Time-locked rewards smart contract for WAX Blockchain (or any Antelope-based chain).

This contract is useful for rewarding users/team members with tokens by slowly unlocking them over a period of time to avoid sharp selloffs which might affect the token price negatively.

This contract is designed to work out-of-the-box, without the need to modify the source code.

All the main features are fully configurable by the contract owner.

## Features

#### For the admin:

-   configurable reward token contract and symbol
-   pause/unpause the contract functionalities
-   add rewards for recipients with configurable unlock time/rate

#### For the user:

-   claim the rewarded tokens gradually over time

## Testing

The contract is fully tested using proton's [VeRT](https://docs.protonchain.com/contract-sdk/testing.html)

-   To build the contract for testing [blanc](https://github.com/haderech/blanc) is required.

```bash
npm install # or yarn or pnpm
npm run build:dev # to compile the contract using blanc++
npm test
```

## Deployment

-   To build & deploy the contract, both of the Antelope [cdt](https://github.com/AntelopeIO/cdt) and [leap](https://github.com/AntelopeIO/leap) are required.

```bash
npm build:prod # to compile the contract using cdt-cpp

# deploy the contract
cleos -u <your_api_endpoint> set contract <account> $PWD contract/timelyreward.wasm contract/timelyreward.abi -p <account>@active

# dont forget to add eosio.code permission
cleos -u <your_api_endpoint> set account permission <account> active --add-code
```

## Want more features ?

_Hire me_ ;)

[![Discord Badge](https://img.shields.io/static/v1?message=Discord&label=Benjie%235458&style=flat&logo=discord&color=7289da&logoColor=7289da)](https://discordapp.com/users/789556474002014219)
[![Telegram Badge](https://img.shields.io/static/v1?message=Telegram&label=benjie_wh&style=flat&logo=telegram&color=229ED9)](https://t.me/benjie_wh)
[![Protonmail Badge](https://img.shields.io/static/v1?message=Email&label=ProtonMail&style=flat&logo=protonmail&color=6d4aff&logoColor=white)](mailto:benjiewheeler@protonmail.com)
[![Github Badge](https://img.shields.io/static/v1?message=Github&label=benjiewheeler&style=flat&logo=github&color=171515)](https://github.com/benjiewheeler)
