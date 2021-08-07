import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import {
  TerraModule,
  TERRA_LCD_BASE_URL,
  TERRA_TESTNET_LCD_BASE_URL,
  TERRA_TESTNET_CHAIN_ID,
  TERRA_MAINNET_CHAIN_ID,
} from 'nestjs-terra'
import { join } from 'path'
import { LoggerOptions } from 'pino'
import { AppResolver } from './app.resolver'
import { AuthModule } from './auth/auth.module'
import { BankModule } from './bank/bank.module'
import { DistributionModule } from './distribution/distribution.module'
import { validate } from './env.validation'
import { GovModule } from './gov/gov.module'
import { MarketModule } from './market/market.module'
import { MintModule } from './mint/mint.module'
import { MsgauthModule } from './msgauth/msgauth.module'
import { OracleModule } from './oracle/oracle.module'
import { SlashingModule } from './slashing/slashing.module'
import { StakingModule } from './staking/staking.module'
import { SupplyModule } from './supply/supply.module'
import { TendermintModule } from './tendermint/tendermint.module'
import { TreasuryModule } from './treasury/treasury.module'
import { TxModule } from './tx/tx.module'
import { UtilsModule } from './utils/utils.module'
import { WasmModule } from './wasm/wasm.module'

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true, validate }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const pinoHttp: LoggerOptions = {
          name: config.get<string>('LOG_NAME'),
          level: config.get<string>('LOG_LEVEL'),
          prettyPrint: false,
        }

        if (config.get<string>('NODE_ENV') !== 'production') {
          pinoHttp.prettyPrint = {
            colorize: true,
            singleLine: true,
            translateTime: true,
          }
        }

        return { pinoHttp }
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: parseInt(config.get<string>('THROTTLE_TTL', '60'), 10),
        limit: parseInt(config.get<string>('THROTTLE_LIMIT', '20'), 10),
      }),
    }),
    TerraModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        let URL = TERRA_LCD_BASE_URL
        let chainID = TERRA_MAINNET_CHAIN_ID

        if (config.get<string>('NODE_ENV') !== 'production') {
          URL = TERRA_TESTNET_LCD_BASE_URL
          chainID = TERRA_TESTNET_CHAIN_ID
        }

        return {
          URL,
          chainID,
        }
      },
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: join(process.cwd(), 'src/schema.graphql'),
    }),
    AuthModule,
    BankModule,
    DistributionModule,
    GovModule,
    MarketModule,
    MintModule,
    MsgauthModule,
    OracleModule,
    SlashingModule,
    StakingModule,
    SupplyModule,
    TendermintModule,
    TreasuryModule,
    WasmModule,
    TxModule,
    UtilsModule,
  ],
  providers: [AppResolver],
})
export class AppModule {}
