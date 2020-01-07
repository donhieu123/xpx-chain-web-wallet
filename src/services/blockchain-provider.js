import { crypto } from 'js-xpx-chain-library'
import {
  Account,
  BlockHttp,
  ChainHttp,
  MosaicHttp,
  AccountHttp,
  NamespaceHttp,
  TransactionHttp,
  SimpleWallet,
  Password,
  DiagnosticHttp,
  MetadataHttp,
  NetworkType,
  Address
} from 'tsjs-xpx-chain-sdk'

class BlockchainProvider {
  constructor (node, protocol, typeNetwork) {
    this.url = this.buildURL(node, protocol)
    this.typeNetwork = NetworkType[typeNetwork]
    this.accountHttp = new AccountHttp(this.url)
    this.blockHttp = new BlockHttp(this.url)
    this.chainHttp = new ChainHttp(this.url)
    this.diagnosticHttp = new DiagnosticHttp(this.url)
    this.metadataHttp = new MetadataHttp(this.url)
    this.mosaicHttp = new MosaicHttp(this.url)
    this.namespaceHttp = new NamespaceHttp(this.url)
    this.transactionHttp = new TransactionHttp(this.url)
  }

  /**
   *
   *
   * @param {*} cant
   * @param {number} [amount=0]
   * @returns
   * @memberof BlockchainProvider
   */
  addZeros (cant, amount = 0) {
    let decimal
    let realAmount
    if (amount === 0) {
      decimal = this.addDecimals(cant)
      realAmount = `0${decimal}`
    } else {
      const arrAmount = amount.toString().replace(/,/g, '').split('.')
      if (arrAmount.length < 2) {
        decimal = this.addDecimals(cant)
      } else {
        const arrDecimals = arrAmount[1].split('')
        decimal = this.addDecimals(cant - arrDecimals.length, arrAmount[1])
      }
      realAmount = `${arrAmount[0]}${decimal}`
    }
    return realAmount
  }

  /**
   *
   *
   * @param {*} cant
   * @param {string} [amount='0']
   * @returns
   * @memberof BlockchainProvider
   */
  addDecimals (cant, amount = '0') {
    const x = '0'
    if (amount === '0') {
      for (let index = 0; index < cant - 1; index++) {
        amount += x
      }
    } else {
      for (let index = 0; index < cant; index++) {
        amount += x
      }
    }
    return amount
  }

  /**
   *
   *
   * @param {*} node
   * @param {*} protocol
   * @returns
   * @memberof BlockchainProvider
   */
  buildURL (node, protocol) {
    let url = null
    switch (protocol) {
      case 'http':
        url = `${protocol}://${node}:3000`
        break
      case 'https':
        url = `${protocol}://${node}:443`
        break
    }

    return url
  }

  /**
   *
   *
   * @param {*} walletName
   * @param {*} password
   * @param {*} [network=this.typeNetwork]
   * @returns
   * @memberof BlockchainProvider
   */
  createSimpleWallet (name, password, network = this.typeNetwork) {
    return SimpleWallet.create(name, this.createPassword(password), network)
  }

  /**
   *
   *
   * @param {*} nameWallet
   * @param {*} password
   * @param {*} privateKey
   * @param {*} network
   * @returns
   * @memberof BlockchainProvider
   */
  createSimpleWalletFromPrivateKey (name, password, privateKey, network = this.typeNetwork) {
    const pass = this.createPassword(password)
    return SimpleWallet.createFromPrivateKey(name, pass, privateKey, network)
  }

  /**
   *
   *
   * @param {*} value
   * @returns
   * @memberof BlockchainProvider
   */
  createPassword (password) {
    return new Password(password)
  }

  /**
   *
   *
   * @param {*} address
   * @returns
   * @memberof BlockchainProvider
   */
  createFromRawAddress (address) {
    return Address.createFromRawAddress(address)
  }

  /**
   *
   *
   * @param {*} privateKey
   * @param {*} network
   * @param {*} address
   * @returns
   * @memberof BlockchainProvider
   */
  checkAddress (privateKey, network, address) {
    return (Account.createFromPrivateKey(privateKey, network).address.plain() === address)
  }

  /**
   *
   *
   * @param {*} common
   * @param {*} account
   * @param {*} [network=this.typeNetwork]
   * @returns
   * @memberof BlockchainProvider
   */
  decrypt (common, account, network) {
    try {
      if (account && account.encrypted !== '' && common) {
        if (!crypto.passwordToPrivatekey(common, account, account.algo)) {
          return { status: false, msg: 'Invalid password' }
        }

        if (common.isHW) {
          return { status: true, msg: '' }
        }

        if (!this.isValidPrivateKey(common.privateKey) || !this.checkAddress(common.privateKey, network, account.address)) {
          return { status: false, msg: 'Invalid password' }
        }

        return { status: true, msg: '' }
      } else {
        return { status: false, msg: 'You do not have a valid account selected' }
      }
    } catch (error) {
      console.log(error)
      return { status: false, msg: 'You do not have a valid account selected.' }
    }
  }

  /**
   *
   *
   * @param {*} privateKey
   * @returns
   * @memberof BlockchainProvider
   */
  isValidPrivateKey (privateKey) {
    if (privateKey && (privateKey.length !== 64 && privateKey.length !== 66)) {
      // console.error('Private key length must be 64 or 66 characters !')
      return false
    } else if (privateKey && !this.isHexadecimal(privateKey)) {
      // console.error('Private key must be hexadecimal only !')
      return false
    } else {
      return true
    }
  }

  /**
   *
   *
   * @param {*} str
   * @returns
   * @memberof BlockchainProvider
   */
  isHexadecimal (str) {
    if (str) {
      return str && str.match('^(0x|0X)?[a-fA-F0-9]+$') !== null
    }

    return false
  }

  /**
   *
   *
   * @param {*} privateKey
   * @param {*} network
   * @returns
   * @memberof BlockchainProvider
   */
  getAccountFromPrivateKey (privateKey, network) {
    return Account.createFromPrivateKey(privateKey, network)
  }

  /**
   *
   *
   * @param {*} privateKey
   * @returns
   * @memberof BlockchainProvider
   */
  getPrefixAndPrivateKey (privateKey) {
    let pref = null
    let newPrivateKey = privateKey
    if (newPrivateKey && newPrivateKey.length > 64) {
      pref = newPrivateKey.slice(0, -64)
      newPrivateKey = newPrivateKey.slice(2)
    }

    return {
      pref: pref,
      pvk: newPrivateKey
    }
  }

  /**
   *
   *
   * @returns
   * @memberof BlockchainProvider
   */
  getNetworkTypes () {
    return {
      testnet: {
        text: 'Public Test',
        value: NetworkType.TEST_NET
      },
      mainnet: {
        text: 'Main Net',
        value: NetworkType.MAIN_NET
      }
    }
  }
}

export { BlockchainProvider }
