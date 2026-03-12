const {withEntitlementsPlist} = require('@expo/config-plugins')

const withAppEntitlements = config => {
  // eslint-disable-next-line no-shadow
  return withEntitlementsPlist(config, async config => {
    const appGroup = 'group.download.darkworld'
    config.modResults['com.apple.security.application-groups'] = [appGroup]
    return config
  })
}

module.exports = {withAppEntitlements}
