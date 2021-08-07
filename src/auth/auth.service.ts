import { Injectable } from '@nestjs/common'
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino'
import { AccAddress, InjectTerraLCDClient, TerraLCDClient, Account as TerraAccount } from 'nestjs-terra'
import { Coin } from 'src/common/models'
import { Account, VestingAccount, PublicKey, MultisigPublicKey } from './models'

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    @InjectTerraLCDClient()
    private readonly terraClient: TerraLCDClient,
  ) {}

  public async accountInfo(address: AccAddress): Promise<Account | VestingAccount> {
    try {
      const accountInfo = await this.terraClient.auth.accountInfo(address)
      let publicKey: PublicKey | MultisigPublicKey | null = null

      if (accountInfo.public_key) {
        const publicKeyData = accountInfo.public_key.toData()

        if (typeof publicKeyData.value === 'string') {
          publicKey = new PublicKey(publicKeyData.type, publicKeyData.value)
        } else {
          publicKey = new MultisigPublicKey(
            publicKeyData.type,
            publicKeyData.value.threshold,
            publicKeyData.value.pubkeys,
          )
        }
      }

      const account: Account = {
        address: accountInfo.address,
        coins: Coin.fromTerraCoins(accountInfo.coins),
        public_key: publicKey,
        account_number: accountInfo.account_number,
        sequence: accountInfo.sequence,
      }

      if (accountInfo instanceof TerraAccount) {
        return account
      }

      return {
        ...account,
        original_vesting: Coin.fromTerraCoins(accountInfo.original_vesting),
        delegated_free: Coin.fromTerraCoins(accountInfo.delegated_free),
        delegated_vesting: Coin.fromTerraCoins(accountInfo.delegated_vesting),
        end_time: accountInfo.end_time,
        vesting_schedules: accountInfo.vesting_schedules.map((schedule) => ({
          denom: schedule.denom,
          schedules: schedule.schedules.map((item) => item.toData()),
        })),
      }
    } catch (err) {
      this.logger.error({ err }, 'Error getting account info for %s.', address)

      throw err
    }
  }
}
