import { useNavigation } from '@react-navigation/native';
import { Button, Card, Divider, Icon, Text, TopNavigation, useTheme } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Image, View, ImageBackground, Switch } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import PageTitle from '../components/PageTitle';
import StableSafeArea from '../components/safeArea/StableSafeArea';
import { APP_STORE_IOS_ID, BUTTON_FONT_SIZE, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN, DEFAULT_CORNER_RADIUS, DEFAULT_MODAL_TITLE, DEFAULT_PADDING, DEFAULT_TEXT_SIZE, LOCAL_STORAGE_KEYS, PAGES, TOAST_POSITION } from '../utils/constants';
import { openURL } from '../utils/utils';
import DeviceInfo from 'react-native-device-info';
import AUTHENTICATOR_ICON from '../assets/authenticator.jpg'
import { restorePurchases } from '../iap/PurchaseIAP';
import { deleteAccount, signInWithAppleCredentials, signOut } from '../firebase/firebaseAuth';
import RNModal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import Rate from 'react-native-rate'
import SettingsCell from '../components/cells/SettingsCell';
import { setDarkMode } from '../redux/AccountSlice';
import { setToLocalStorage } from '../storage/StorageManager';

const Settings = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const premium = useSelector((state: any) => state.accountSlice.premium);
    const uid = useSelector((state: any) => state.accountSlice.uid);
    const authenticated = useSelector((state: any) => state.accountSlice.authenticated);
    const [signinModalVisible, setSigninModalVisible] = useState(false)
    const [deletionModalVisible, setDeletionModalVisible] = useState(false)
    const darkMode = useSelector((state: any) => state.accountSlice.darkMode);
    const dispatch = useDispatch()

    const renderTitle = (props: any) => (
        <PageTitle title='Settings' props={props} />
    );

    const goBack = () => {
        navigation.goBack()
    }


    const rateApp = () => {
        Toast.show({
            type: 'success',
            position: TOAST_POSITION,
            text1: 'Reaching store ...',
            text2: 'Wait a couple seconds as we load things ☺️',
            visibilityTime: 2000,
            autoHide: true,
            topOffset: 30,
            bottomOffset: 40,
            onShow: () => { },
            onHide: () => { },
            onPress: () => { },
            props: { iconName: 'web' }
        });
        const options = {
            AppleAppID: APP_STORE_IOS_ID,
            preferInApp: true,
            openAppStoreIfInAppFails: true,
        }
        Rate.rate(options, success => {
            if (success) {
            }
        })
    }


    const onDarkModeValueChange = async () => {
        let newValue = !darkMode
        await setToLocalStorage({ key: LOCAL_STORAGE_KEYS.DARK_MODE, value: newValue.toString() })
        dispatch(setDarkMode(newValue))
    }

    return (
        <View style={{ flex: 1 }}>

            <TopNavigation
                style={{
                    paddingTop: 15, backgroundColor: theme['color-basic-500'],
                    paddingLeft: DEFAULT_PADDING,
                    paddingRight: DEFAULT_PADDING
                }}
                title={renderTitle}
            />

            <ScrollView
                style={{ backgroundColor: theme['color-basic-500'], flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50, paddingTop: 0, marginTop: 20 }}>

                <View style={styles().settingsBox}>

                    <View style={styles().settingsItem}>
                        <View style={styles().settingsTextAndIcon}>
                            <View style={{ ...styles().iconBox, ...{ backgroundColor: 'rgb(0,0,0)' } }}>
                                <MaterialCommunityIcons name="compare" size={16} color={'#fff'} />
                            </View>
                            <Text style={styles().settingsText}>Dark Mode</Text>
                        </View>
                        {
                            premium
                                ? < Switch
                                    trackColor={{ false: theme['color-basic-600'], true: theme['color-basic-500'] }}
                                    thumbColor={darkMode ? theme['color-primary-500'] : theme['color-basic-600']}
                                    onValueChange={() => onDarkModeValueChange()}
                                    value={darkMode}
                                />
                                : <TouchableOpacity onPress={() => navigation.navigate(PAGES.PAYWALL)}>
                                    <Text style={{ color: theme['text-basic-color'] }}>Upgrade</Text>
                                </TouchableOpacity>
                        }
                    </View>

                </View>

                <View style={styles().settingsBox}>

                    <TouchableOpacity style={styles().settingsItem}
                        onPress={() => rateApp()}>
                        <View style={styles().settingsTextAndIcon}>
                            <View style={{ ...styles().iconBox, ...{ backgroundColor: 'rgb(249,222,82)' } }}>
                                <MaterialCommunityIcons name="star" size={16} color={'#fff'} />
                            </View>
                            <Text style={styles().settingsText}>Give us a rating 😊</Text>
                        </View>
                        <Icon name='diagonal-arrow-right-up-outline' fill={theme['text-basic-color']} style={styles().settingsItemIcon} />
                    </TouchableOpacity>

                </View>

                <View style={styles().settingsBox}>

                    <View style={styles().settingsItem}
                    >
                        <TouchableOpacity style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => setSigninModalVisible(true)}>
                            <View style={styles().settingsTextAndIcon}>
                                <View style={{ ...styles().iconContainer, ...{ backgroundColor: 'rgb(53,120,246)' } }}>
                                    <MaterialIcons name="person" size={16} color={'#fff'} />
                                </View>
                                <Text style={styles().settingsText}>Sign In</Text>
                            </View>
                            <Icon name='info-outline' fill={theme['text-basic-color']} style={{ width: 20, height: 20, marginLeft: 5 }} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => authenticated ? signOut() : signInWithAppleCredentials()} >
                            <Text style={styles().rightButtons}>
                                {authenticated ? 'Log Out' : ' Sign in with Apple'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Divider style={styles().divider} />

                    <TouchableOpacity style={styles().settingsItem}
                        onPress={() => {
                            Clipboard.setString(uid)
                            authenticated ? Toast.show({
                                type: 'success',
                                position: TOAST_POSITION,
                                text1: 'User ID copied',
                                text2: 'Share it with the support if asked',
                                visibilityTime: 2000,
                                autoHide: true,
                                topOffset: 30,
                                bottomOffset: 40,
                                onShow: () => { },
                                onHide: () => { },
                                onPress: () => { },
                                props: { iconName: 'face-agent' }
                            })
                                : setSigninModalVisible(true)
                        }}>
                        <View style={styles().settingsTextAndIcon}>
                            <View style={{ ...styles().iconContainer, ...{ backgroundColor: 'rgb(89,168,214)' } }}>
                                <MaterialCommunityIcons name="badge-account" size={16} color={'#fff'} />
                            </View>
                            <Text style={styles().settingsText}>User ID</Text>
                        </View>
                        <Text ellipsizeMode='tail' numberOfLines={1}
                            style={{ width: '50%', textAlign: 'right', color: theme['text-basic-color'] }}>{uid ? uid : 'N/A'}</Text>
                    </TouchableOpacity>

                </View>

                <View style={styles().settingsBox}>

                    <SettingsCell
                        headingIcon='security'
                        trailingIcon='arrow-ios-forward'
                        text='Security Config'
                        iconBackgroundColor='rgb(116, 171, 131)'
                        onPress={() => navigation.navigate(PAGES.SECURITY_CONFIG)}
                    />

                </View>

                <View style={styles().settingsBox}>

                    <SettingsCell
                        headingIcon='information-variant'
                        trailingIcon='arrow-ios-forward'
                        text='How it works'
                        iconBackgroundColor='rgb(230, 71, 116)'
                        onPress={() => navigation.navigate(PAGES.ONBOARDING)}
                    />

                    <Divider style={styles().divider} />

                    <SettingsCell
                        headingIcon='github'
                        trailingIcon='diagonal-arrow-right-up-outline'
                        text='Open Source Repository'
                        iconBackgroundColor='rgb(0,0,0)'
                        onPress={() => openURL('https://github.com/get-sentinel/crypto-warden')}
                    />

                    <Divider style={styles().divider} />

                    <SettingsCell
                        headingIcon='police-badge'
                        trailingIcon='diagonal-arrow-right-up-outline'
                        text='Read our Security Model'
                        iconBackgroundColor='rgb(84, 190, 255)'
                        onPress={() => openURL('https://getsentinel.io/security-model?ref=app')}
                    />
                </View>

                <Text style={{ fontSize: 13, fontWeight: '600', marginLeft: DEFAULT_3x_MARGIN, marginBottom: DEFAULT_1x_MARGIN }}>{"Other apps from Sentinel"}</Text>

                <View style={styles().settingsBox}>

                    <TouchableOpacity style={styles().settingsItem}
                        onPress={() => openURL('https://apps.apple.com/it/app/sentinel-authenticator-2fa/id1189922806')}>
                        <View style={styles().settingsTextAndIcon}>
                            <View style={{ marginRight: 10 }}>
                                <Image source={AUTHENTICATOR_ICON} style={{ width: 26, height: 26, borderRadius: 5 }} />
                            </View>
                            <Text style={styles().settingsText}>Secure 2FA Authenticator</Text>
                        </View>
                        <Icon name='diagonal-arrow-right-up-outline' fill={theme['text-basic-color']} style={styles().settingsItemIcon} />
                    </TouchableOpacity>

                </View>

                <View style={styles().settingsBox}>

                    <SettingsCell
                        headingIcon='restore'
                        trailingIcon='arrow-ios-forward'
                        text='Restore Purchase'
                        iconBackgroundColor='rgb(53,120,246)'
                        onPress={() => restorePurchases(dispatch)}
                    />

                    <Divider style={styles().divider} />

                    <SettingsCell
                        headingIcon='email'
                        trailingIcon='diagonal-arrow-right-up-outline'
                        text='Email'
                        iconBackgroundColor='rgb(241,155,55)'
                        onPress={() => openURL('mailto:hello@getsentinel.io')}
                    />

                    <Divider style={styles().divider} />

                    <SettingsCell
                        headingIcon='twitter'
                        trailingIcon='diagonal-arrow-right-up-outline'
                        text='Twitter'
                        iconBackgroundColor='rgb(89,168,214)'
                        onPress={() => openURL('https://twitter.com/sentinel2FA')}
                    />

                    <Divider style={styles().divider} />

                    <SettingsCell
                        headingIcon="frequently-asked-questions"
                        trailingIcon='diagonal-arrow-right-up-outline'
                        text='FAQ'
                        iconBackgroundColor='rgb(163,86,215)'
                        onPress={() => openURL('https://getsentinel.io/crypto-warden#faq')}
                    />

                </View>

                <View style={styles().settingsBox}>

                    <View style={styles().settingsItem}>
                        <View style={styles().settingsTextAndIcon}>
                            <View style={{ ...styles().iconContainer, ...{ backgroundColor: 'rgb(0,0,0)' } }}>
                                <MaterialIcons name="code" size={16} color={'#fff'} />
                            </View>
                            <Text style={styles().settingsText}>Version</Text>
                        </View>
                        <Text style={styles().rightButtons}>{DeviceInfo.getVersion()}</Text>
                    </View>

                    <Divider style={styles().divider} />

                    <SettingsCell
                        headingIcon="application-outline"
                        trailingIcon='diagonal-arrow-right-up-outline'
                        text='Website'
                        iconBackgroundColor='rgb(101,195,102)'
                        onPress={() => openURL('https://getsentinel.io/crypto-warden')}
                    />

                    <Divider style={styles().divider} />


                    <SettingsCell
                        headingIcon="shield-search"
                        trailingIcon='diagonal-arrow-right-up-outline'
                        text='Privacy Policy'
                        iconBackgroundColor='rgb(53,120,246)'
                        onPress={() => openURL('https://getsentinel.io/privacy-policy?ref=app')}
                    />

                    <Divider style={styles().divider} />

                    <SettingsCell
                        headingIcon="copyright"
                        trailingIcon='diagonal-arrow-right-up-outline'
                        text='Copyright'
                        iconBackgroundColor='rgb(170,170,170)'
                        onPress={() => openURL('https://getsentinel.io/terms-of-service?ref=app')}
                    />

                </View>

                <View style={styles().settingsBox}>

                    <TouchableOpacity style={styles().settingsItem}
                        onPress={() => {
                            if (authenticated) {
                                setDeletionModalVisible(true)
                            } else {
                                Toast.show({
                                    type: 'success',
                                    position: TOAST_POSITION,
                                    text1: 'Error',
                                    text2: 'You need to sign-in first',
                                    visibilityTime: 2000,
                                    autoHide: true,
                                    topOffset: 30,
                                    bottomOffset: 40,
                                    onShow: () => { },
                                    onHide: () => { },
                                    onPress: () => { },
                                    props: { iconName: 'alert' }
                                })
                            }
                        }}>
                        <View style={styles().settingsTextAndIcon}>
                            <View style={{ ...styles().iconContainer, ...{ backgroundColor: 'rgb(235,78,61)' } }}>
                                <MaterialCommunityIcons name="account-remove" size={16} color={'#fff'} />
                            </View>
                            <Text style={styles().settingsText}>Delete Account</Text>
                        </View>
                        <Icon name='arrow-ios-forward' fill={theme['text-basic-color']} style={styles().settingsItemIcon} />
                    </TouchableOpacity>

                </View>

            </ScrollView>

            <RNModal
                isVisible={signinModalVisible}
                onBackdropPress={() => setSigninModalVisible(false)}
                onSwipeComplete={() => setSigninModalVisible(false)}
                swipeDirection='down'
                style={{
                    justifyContent: "flex-end",
                    margin: 0
                }}
            >

                <Card
                    disabled={true}
                    style={{
                        backgroundColor: theme['color-basic-modal-background'],
                        borderColor: 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingBottom: 0,
                        paddingHorizontal: DEFAULT_2x_MARGIN,
                        width: '100%'
                    }}
                >
                    <MaterialCommunityIcons style={{ marginTop: 10, marginBottom: 10, alignSelf: 'center' }} name="apple" size={70} color={theme['text-basic-color']} />

                    <Text style={{ color: theme['text-basic-color'], fontSize: DEFAULT_MODAL_TITLE, fontWeight: '600', marginBottom: 30, textAlign: 'center' }}>{"Sign In with Apple"}</Text>

                    <Text style={styles().signInModalDescription}>{"Why should you sign-in?"}</Text>

                    <View style={styles().bulletPoint}>
                        <MaterialCommunityIcons name="crown" size={25} color={theme['text-basic-color']} style={{ marginRight: DEFAULT_2x_MARGIN }} />
                        <Text style={styles().signInModalDescription}>{"Transfer your Premium purchase between iOS and macOS devices"}</Text>
                    </View>

                    <View style={styles().bulletPoint}>
                        <MaterialCommunityIcons name="email" size={25} color={theme['text-basic-color']} style={{ marginRight: DEFAULT_2x_MARGIN }} />
                        <Text style={styles().signInModalDescription}>{"Stay informed with important news about Sentinel"}</Text>
                    </View>

                    <View style={styles().bulletPoint}>
                        <MaterialCommunityIcons name="vote" size={25} color={theme['text-basic-color']} style={{ marginRight: DEFAULT_2x_MARGIN }} />
                        <Text style={styles().signInModalDescription}>{"Cast your vote to shape the roadmap of Sentinel"}</Text>
                    </View>

                    <Text style={{ ...styles().signInModalDescription, ...{ marginTop: DEFAULT_2x_MARGIN } }}>{"No data will be transferred outside of your iCloud Keychain"}</Text>

                    <Button
                        style={{ width: '100%', marginTop: 30, borderRadius: DEFAULT_CORNER_RADIUS, backgroundColor: theme['background-color-button'], borderWidth: 0 }}
                        onPress={() => {
                            setSigninModalVisible(false)
                            if (!authenticated) { signInWithAppleCredentials() }
                        }}>
                        {props => <Text {...props} style={{ color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                            {authenticated ? 'I understand' : ` Sign in with Apple`}
                        </Text>}
                    </Button>
                </Card>

            </RNModal>

            <RNModal
                isVisible={deletionModalVisible}
                onBackdropPress={() => setDeletionModalVisible(false)}
                onSwipeComplete={() => setDeletionModalVisible(false)}
                swipeDirection='down'
                style={{
                    justifyContent: "flex-end",
                    margin: 0
                }}
            >

                <Card
                    disabled={true}
                    style={{
                        backgroundColor: theme['color-basic-modal-background'],
                        borderColor: 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingBottom: 0,
                    }}
                >
                    <MaterialCommunityIcons style={{ marginTop: 10, marginBottom: 10, alignSelf: 'center' }} name="delete-variant" size={70} color={theme['text-basic-color']} />

                    <Text style={{ color: theme['text-basic-color'], fontSize: DEFAULT_MODAL_TITLE, fontWeight: '600', marginBottom: 30, textAlign: 'center' }}>{"Are you sure you want to delete your account?"}</Text>

                    <Button
                        style={{ width: '100%', marginTop: 30, borderRadius: DEFAULT_CORNER_RADIUS, backgroundColor: theme['background-color-button'], borderWidth: 0 }}
                        onPress={() => {
                            setDeletionModalVisible(false)
                            deleteAccount()
                        }}>
                        {props => <Text {...props} style={{ color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                            {'Delete'}
                        </Text>}
                    </Button>

                    <Button
                        style={{ width: '100%', marginTop: 0, borderWidth: 0 }}
                        onPress={() => setDeletionModalVisible(false)}>
                        {props => <Text {...props} style={{ color: theme['text-basic-color'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                            {`Cancel`}
                        </Text>}
                    </Button>
                </Card>

            </RNModal>
        </View>
    )
}

const styles = () => {
    const theme = useTheme();

    return StyleSheet.create({
        settingsText: {
            // fontWeight: '500',
            fontSize: 17,
            color: theme['text-basic-color']
        },
        settingsBox: {
            backgroundColor: theme['color-basic-600'],
            display: 'flex',
            borderRadius: DEFAULT_CORNER_RADIUS,
            paddingHorizontal: 0,
            marginBottom: 30,
            marginHorizontal: 20,
            // borderWidth: 1,
            // borderColor: theme['transparency-basic-color']
        },
        settingsItem: {
            display: 'flex',
            width: '100%',
            height: 55,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            paddingHorizontal: 15,
        },
        settingsItemIcon: {
            width: 20,
            height: 20
        },
        divider: {
            backgroundColor: theme['color-basic-300'],
            width: '90%',
            alignSelf: 'flex-end'
        },
        settingsTextAndIcon: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        rightButtons: {
            fontSize: 16,
            fontWeight: '400',
            // textTransform: 'capitalize',
            color: theme['text-basic-color']
        },
        bulletPoint: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: DEFAULT_2x_MARGIN,
        },
        iconContainer: {
            marginRight: 10,
            borderRadius: 5,
            padding: 5
        },
        signInModalDescription: {
            color: theme['text-basic-color'],
            textAlign: 'left',
            fontSize: DEFAULT_TEXT_SIZE,
            fontWeight: '400'
        },
        iconBox: {
            marginRight: 10,
            borderRadius: 6,
            padding: 5
        }
    })
}

export default Settings