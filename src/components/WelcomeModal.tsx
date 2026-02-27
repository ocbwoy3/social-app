import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {ImageBackground} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {FocusGuards, FocusScope} from 'radix-ui/internal'

import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, flatten, useBreakpoints, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

const welcomeModalBgSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bfe3ff"/>
      <stop offset="55%" stop-color="#d8efff"/>
      <stop offset="100%" stop-color="#f5f9ff"/>
    </linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.0"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.85"/>
    </linearGradient>
    <pattern id="cigPattern" width="180" height="140" patternUnits="userSpaceOnUse">
      <g transform="translate(20 30) rotate(-10)">
        <rect x="0" y="0" rx="6" ry="6" width="120" height="18" fill="#f3f2ee" fill-opacity="0.75"/>
        <rect x="0" y="0" width="20" height="18" fill="#c97a3e" fill-opacity="0.85"/>
        <rect x="96" y="0" width="24" height="18" fill="#d6d3cc" fill-opacity="0.6"/>
        <path d="M124 -6 C136 -10 144 -2 150 -10" stroke="#cfd6e2" stroke-opacity="0.35" stroke-width="3" fill="none"/>
        <path d="M126 -2 C136 -6 148 4 156 -2" stroke="#cfd6e2" stroke-opacity="0.25" stroke-width="2" fill="none"/>
      </g>
      <g transform="translate(40 90) rotate(12)">
        <rect x="0" y="0" rx="6" ry="6" width="110" height="16" fill="#f3f2ee" fill-opacity="0.6"/>
        <rect x="0" y="0" width="18" height="16" fill="#c97a3e" fill-opacity="0.75"/>
        <rect x="88" y="0" width="22" height="16" fill="#d6d3cc" fill-opacity="0.5"/>
      </g>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  <rect width="1200" height="800" fill="url(#cigPattern)"/>
  <rect y="480" width="1200" height="320" fill="url(#haze)"/>
</svg>
`.trim()

const welcomeModalBg = {
  uri: `data:image/svg+xml;utf8,${encodeURIComponent(welcomeModalBgSvg)}`,
}

interface WelcomeModalProps {
  control: {
    isOpen: boolean
    open: () => void
    close: () => void
  }
}

export function WelcomeModal({control}: WelcomeModalProps) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const {gtMobile} = useBreakpoints()
  const [isExiting, setIsExiting] = useState(false)

  const fadeOutAndClose = (callback?: () => void) => {
    setIsExiting(true)
    setTimeout(() => {
      control.close()
      if (callback) callback()
    }, 150)
  }

  useEffect(() => {
    if (control.isOpen) {
      ax.metric('welcomeModal:presented', {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [control.isOpen])

  const onPressExplore = () => {
    ax.metric('welcomeModal:exploreClicked', {})
    fadeOutAndClose()
  }

  const onPressSignIn = () => {
    ax.metric('welcomeModal:signinClicked', {})
    control.close()
    requestSwitchToAccount({requestedAccount: 'existing'})
  }

  FocusGuards.useFocusGuards()

  return (
    <View
      role="dialog"
      aria-modal
      style={[
        a.fixed,
        a.inset_0,
        a.justify_center,
        a.align_center,
        {zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.2)'},
        web({backdropFilter: 'blur(15px)'}),
        isExiting ? a.fade_out : a.fade_in,
      ]}>
      <FocusScope.FocusScope asChild loop trapped>
        <View
          style={flatten([
            {
              maxWidth: 800,
              maxHeight: 600,
              width: '90%',
              height: '90%',
              backgroundColor: '#C0DCF0',
            },
            a.rounded_lg,
            a.overflow_hidden,
            a.zoom_in,
          ])}>
          <ImageBackground
            source={welcomeModalBg}
            style={[a.flex_1, a.justify_center]}
            contentFit="cover">
            <View style={[a.gap_2xl, a.align_center, a.p_4xl]}>
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.justify_center,
                  a.w_full,
                  a.p_0,
                ]}>
                <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                  <Logo width={26 * 2} />
                  <Text
                    style={[
                      a.text_2xl,
                      a.font_semi_bold,
                      a.user_select_none,
                      {color: '#354358', letterSpacing: -0.5},
                    ]}>
                    {' '}
                    "Bluesky on Crack"
                  </Text>
                </View>
              </View>
              <View
                style={[
                  a.gap_sm,
                  a.align_center,
                  a.pt_5xl,
                  a.pb_3xl,
                  a.mt_2xl,
                ]}>
                <Text
                  style={[
                    gtMobile ? a.text_4xl : a.text_3xl,
                    a.font_semi_bold,
                    a.text_center,
                    {color: '#354358'},
                    web({
                      backgroundImage:
                        'linear-gradient(180deg, #313F54 0%, #667B99 83.65%, rgba(102, 123, 153, 0.50) 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                      lineHeight: 1.2,
                      letterSpacing: -0.5,
                    }),
                  ]}>
                  <Trans>Real people.</Trans>
                  {'\n'}
                  <Trans>Real conversations.</Trans>
                  {'\n'}
                  <Trans>Social media you control.</Trans>
                </Text>
              </View>
              <View style={[a.gap_md, a.align_center]}>
                <View>
                  <Button
                    onPress={onPressSignIn}
                    label={_(msg`Sign in`)}
                    size="large"
                    color="primary"
                    style={{
                      width: 200,
                      backgroundColor: '#006AFF',
                    }}>
                    <ButtonText>
                      <Trans>Sign in</Trans>
                    </ButtonText>
                  </Button>
                  <Button
                    onPress={onPressExplore}
                    label={_(msg`Explore the app`)}
                    size="large"
                    color="primary"
                    variant="ghost"
                    style={[a.bg_transparent, {width: 200}]}
                    hoverStyle={[a.bg_transparent]}>
                    {({hovered}) => (
                      <ButtonText
                        style={[hovered && [a.underline], {color: '#006AFF'}]}>
                        <Trans>Explore the app</Trans>
                      </ButtonText>
                    )}
                  </Button>
                </View>
                <View style={[a.align_center, {minWidth: 200}]}>
                  <Text
                    style={[
                      a.text_sm,
                      a.text_center,
                      {color: '#313F54', lineHeight: 16},
                    ]}>
                    <Trans>
                      This is a third-party modification of Bluesky's Social
                      App.
                      <br />
                      We claim no association with Bluesky Social PBC.
                      <br />
                      Use at your own risk.
                    </Trans>
                  </Text>
                </View>
              </View>
            </View>
            <Button
              label={_(msg`Close welcome modal`)}
              style={[
                a.absolute,
                {
                  top: 8,
                  right: 8,
                },
                a.bg_transparent,
              ]}
              hoverStyle={[a.bg_transparent]}
              onPress={() => {
                ax.metric('welcomeModal:dismissed', {})
                fadeOutAndClose()
              }}
              color="secondary"
              size="small"
              variant="ghost"
              shape="round">
              {({hovered, pressed, focused}) => (
                <XIcon
                  size="md"
                  style={{
                    color: '#354358',
                    opacity: hovered || pressed || focused ? 1 : 0.7,
                  }}
                />
              )}
            </Button>
          </ImageBackground>
        </View>
      </FocusScope.FocusScope>
    </View>
  )
}
