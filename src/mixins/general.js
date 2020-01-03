export default {
  methods: {
    buildStructureService (t, s, d, i, r, ch, vch, cn) {
      return {
        title: t,
        show: s,
        description: d,
        image: i,
        route: r,
        children: ch,
        viewChildren: vch,
        className: cn
      }
    },
    doCopy (text) {
      this.$copyText(text).then((e) => {
        this.$store.dispatch('showMSG', {
          snackbar: true,
          text: `Copied`,
          color: 'success'
        })
      }, (e) => {
        console.log(e)
        this.$store.dispatch('showMSG', {
          snackbar: true,
          text: `Can not copy`,
          color: 'error'
        })
      })
    },
    getConfigForm () {
      return {
        generalRules: {
          notAllowSpaces: v => (v || '').indexOf(' ') < 0 || 'No spaces are allowed'
        },
        walletName: {
          label: 'Wallet Name',
          icon: 'icon-wallet-name-green-16h-proximax-sirius-wallet.svg',
          min: 3,
          max: 30,
          rules: {
            required: v => !!v || 'Wallet Name is required',
            min: v => (v && v.length >= 3) || 'Wallet Name must be less than 3 characters',
            max: v => (v && v.length <= 30) || 'Wallet Name must be a maximum of 30 characters'
          }
        },
        password: {
          label: 'Password',
          icon: 'icon-wallet-name-green-16h-proximax-sirius-wallet.svg',
          min: 8,
          max: 30,
          show: false,
          showConfirm: false,
          rules: {
            required: value => !!value || 'Password is required',
            min: v =>
              (v && v.length >= 8) || 'Password must be less than 8 characters',
            max: v =>
              (v && v.length <= 30) || 'Password must be a maximum of 30 characters'
          }
        }
      }
    },
    isMatch (value1, value2, nameValidation = '') {
      return value1 === value2 || `${nameValidation} must match`
    },
    removeSpaces (input) {
      return (input) ? input.replace(/ /g, '') : input
    },
    toTitleCase (str) {
      return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      })
    }
  }
}
