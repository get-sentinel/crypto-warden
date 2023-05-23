import { NavigationContainer, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, ImageBackground, Linking, NativeModules, Platform, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from "react-native";
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import {
    Button,
    Text,
    useTheme, Spinner, Divider, TopNavigation, Card, Toggle
} from '@ui-kitten/components';
import { useDispatch, useSelector } from "react-redux";
import { BUTTON_FONT_SIZE, DEFAULT_05x_MARGIN, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN, DEFAULT_CORNER_RADIUS, DEFAULT_MODAL_TITLE, DEFAULT_PADDING, SECURITY_OPTIONS } from "../utils/constants";
import { isSmallScreen, openURL } from "../utils/utils";
import PageTitle from "../components/PageTitle";
import SecurityCell from "../components/cells/SecurityCell";
import RNModal from 'react-native-modal';
import { globalStyles } from "../utils/globalStyles";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { switchSecureStorage } from "../storage/StorageManager";

const SecurityConfig = React.memo(() => {

    const theme = useTheme();
    const dispatch = useDispatch()
    const securityOption = useSelector((state: any) => state.accountSlice.securityOption);
    const password = useSelector((state: any) => state.accountSlice.password);
    const wallets = useSelector((state: any) => state.walletSlice.wallets);
    const uid = useSelector((state: any) => state.accountSlice.uid);
    const [selectedOption, setSelectedOption] = useState(securityOption);
    const [oldSecurityOption, _] = useState(securityOption);
    const [hasChanged, setHasChanged] = useState(false);
    const [newPassword, setNewPassword] = useState(password);
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [isMigrationCompleted, setIsMigrationCompleted] = useState(false);
    const [deleteOrigin, setDeleteOrigin] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const navigation = useNavigation()

    useEffect(() => {
        if (selectedOption !== securityOption || newPassword !== password) {
            setHasChanged(true)
        } else {
            setHasChanged(false)
        }
    }, [selectedOption, newPassword])


    const goBack = () => {
        navigation.goBack()
    }

    const renderTitle = (props: any) => (
        <PageTitle title='Security Config' props={props} />
    );

    const confirmUpdate = async () => {
        await switchSecureStorage({
            local: wallets,
            oldSecurityOption: oldSecurityOption,
            newSecurityOption: selectedOption,
            newPassword: newPassword,
            oldPassword: password,
            uid: uid,
            setStatusMessage: setStatusMessage,
            deleteOrigin: deleteOrigin,
            dispatch: dispatch
        })
        setIsMigrationCompleted(true)
    }

    const getStatus = () => {
        if (hasChanged && selectedOption === SECURITY_OPTIONS.SENTINEL && !uid) {
            return { state: 0, message: 'You must login to enable Cloud option' }
        } else if (hasChanged && selectedOption === SECURITY_OPTIONS.SENTINEL && !newPassword) {
            return { state: 0, message: 'Enter a password to proceed' }
        } else if (!hasChanged) {
            return { state: 0, message: 'Nothing\'s changed' }
        } else {
            return { state: 1, message: 'Update Security Config' }
        }
    }

    const resetState = () => {
        setConfirmationModalVisible(false)
        setIsMigrationCompleted(false)
        setDeleteOrigin(false)
        setStatusMessage('')
        setHasChanged(false)
    }

    return (
        <View style={{
            flex: 1,
            paddingLeft: DEFAULT_PADDING,
            paddingRight: DEFAULT_PADDING,
            backgroundColor: theme['color-basic-500'],
            paddingBottom: isSmallScreen() ? 15 : 50,
        }}>

            <TopNavigation
                style={{
                    paddingTop: 15,
                    paddingHorizontal: 0
                }}
                title={renderTitle}
            />

            <ScrollView
                style={{
                    flex: 1,
                }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50, paddingTop: 0, marginTop: 20 }}>

                <Text>{'Choose your security configuration:'}</Text>

                {
                    Platform.OS !== 'android'
                        ? <SecurityCell
                            title="iCloud Keychain"
                            description="Data will be stored in the iCloud Keychain, managed and secured by Apple."
                            selected={selectedOption === SECURITY_OPTIONS.ICLOUD}
                            sync="iOS, macOS"
                            alert="Make sure iCloud Keychain Sharing is enabled in Settings/iCloud of this device."
                            securityOption={SECURITY_OPTIONS.ICLOUD}
                            onPress={() => setSelectedOption(SECURITY_OPTIONS.ICLOUD)}
                            iconName="apple"
                        />
                        : undefined
                }

                {
                    Platform.OS === 'android'
                        ?
                        <SecurityCell
                            title="Encrypted Storage"
                            description="Data is locally stored on this device within the Android Encrypted Storage."
                            selected={selectedOption === SECURITY_OPTIONS.E_STORAGE}
                            sync="N/A"
                            alert="Make sure your EncryptedStorage is backed-up with your device or you may lose your data."
                            securityOption={SECURITY_OPTIONS.E_STORAGE}
                            onPress={() => setSelectedOption(SECURITY_OPTIONS.E_STORAGE)}
                            iconName="android"
                        />
                        : undefined
                }

                <SecurityCell
                    title="Sentinel Cloud"
                    description={"Data is locally encrypted (AES-256) with your password before transferring to Sentinel Cloud.\nYour password stays on this device.\nWe cannot decrypt your data, by design."}
                    selected={selectedOption === SECURITY_OPTIONS.SENTINEL}
                    sync="iOS, macOS, Android"
                    alert="Don't lose the password to decrypt your data; we cannot recover it."
                    securityOption={SECURITY_OPTIONS.SENTINEL}
                    onPress={() => setSelectedOption(SECURITY_OPTIONS.SENTINEL)}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    iconName="cloud"
                />

            </ScrollView >

            <Text style={{ color: theme['color-primary-500'], fontSize: 12, alignSelf: 'center' }}
                onPress={() => openURL('https://getsentinel.io/security-model')}>
                Check our Security Model for more details
            </Text>

            <Button
                disabled={getStatus().state === 0}
                style={{ width: '100%', marginBottom: 0, marginTop: DEFAULT_1x_MARGIN, backgroundColor: getStatus().state === 1 ? theme['background-color-button'] : theme['color-basic-300'], borderWidth: 0, borderRadius: DEFAULT_CORNER_RADIUS, height: 50 }}
                onPress={() => setConfirmationModalVisible(true)}>
                {props => <Text {...props} style={{ color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE - 3, padding: 0 }}>
                    {getStatus().message}
                </Text>
                }
            </Button >

            <RNModal
                isVisible={confirmationModalVisible}
                onBackdropPress={() => resetState()}
                onSwipeComplete={() => resetState()}
                swipeDirection='down'
                style={{
                    justifyContent: "flex-end",
                    margin: 0,
                }}
            >
                <View
                    style={{
                        backgroundColor: theme['color-basic-modal-background'],
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        paddingTop: DEFAULT_3x_MARGIN,
                        paddingHorizontal: DEFAULT_3x_MARGIN,
                        width: '100%',
                    }}
                >
                    <Text style={{ color: theme['text-basic-color'], fontSize: DEFAULT_MODAL_TITLE, fontWeight: '600', marginBottom: 30, }}>{"Do you want to proceed?"}</Text>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        marginBottom: DEFAULT_3x_MARGIN,
                    }}>
                        <Text style={styles().infoText}>{'Remove data from current storage after migration?'}</Text>

                        <Switch
                            trackColor={{ false: theme['color-basic-600'], true: theme['color-primary-500'] }}
                            thumbColor={theme['text-basic-color']}
                            onValueChange={() => setDeleteOrigin(!deleteOrigin)}
                            value={deleteOrigin}
                        />
                    </View>


                    <View style={styles().infoBox}>
                        <MaterialCommunityIcons
                            style={{ marginRight: 10 }}
                            name={'alert-box'}
                            size={23}
                            color={theme['text-basic-color']} />
                        <Text style={styles().infoText}>{'Please note:'}</Text>
                    </View>

                    {
                        selectedOption === SECURITY_OPTIONS.SENTINEL && newPassword !== password
                            ? <Text style={styles().infoText}>{'It looks like you changed password. Remember to manually input it in all your device to decrypt the data!\n'}</Text>
                            : undefined
                    }

                    <Text style={styles().infoText}>{'The system will try to merge local data with remote data (if any).'}</Text>

                    <Divider style={styles().divider} />

                    <Text style={styles().infoText}>{statusMessage}</Text>

                    {
                        isMigrationCompleted
                            ? <View style={styles().actionButtonContainer}>
                                <Button style={{ ...globalStyles(theme).primaryButton, ...{ width: '100%' } }}
                                    onPress={() => resetState()}>
                                    {
                                        p => <Text {...p} style={{
                                            color: theme['text-primary-color-button'], textAlign: 'center', fontWeight: '600',
                                        }}> {'Migration terminated'} </Text>
                                    }
                                </Button>
                            </View>
                            : <View style={styles().actionButtonContainer}>
                                <Button style={globalStyles(theme).cancelButton}
                                    onPress={() => resetState()}>
                                    {props => <Text {...props} style={{
                                        color: theme['text-basic-color'], textAlign: 'center', fontWeight: '600',
                                    }}>{`Cancel`}</Text>
                                    }
                                </Button>
                                <Button style={globalStyles(theme).primaryButton}
                                    onPress={() => confirmUpdate()}>
                                    {
                                        p => <Text {...p} style={{
                                            color: theme['text-primary-color-button'], textAlign: 'center', fontWeight: '600',
                                        }}> {'Migrate'} </Text>
                                    }
                                </Button>
                            </View>
                    }
                </View>

            </RNModal >
        </View >
    );
});

const styles = () => {
    const theme = useTheme()

    return StyleSheet.create({
        featureText: {
            marginLeft: 20,
            color: theme['color-basic-950'],
            textAlign: 'left',
            fontSize: 16,
            // lineHeight: 25,
            fontWeight: '400'
        },
        columnHeader: {
            color: theme['color-basic-950'],
            textAlign: 'center',
            fontSize: 18,
            // lineHeight: 25,
            fontWeight: '600',
        },
        featureView: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: 15,
            // height: 30,
            // backgroundColor:'#eee'
        },
        iconView: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme['color-primary-500'],
            borderRadius: 4,
            padding: 5
            // height: 30,
            // backgroundColor:'#eee'
        },
        checkIcon: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: 5,
            marginLeft: 20
        },
        textView: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            marginBottom: 5,
        },
        divider: {
            backgroundColor: theme['color-basic-300'],
            width: '100%',
            alignSelf: 'flex-end',
            marginVertical: DEFAULT_2x_MARGIN,
        },
        securityOption: {
            justifyContent: 'space-between',
            paddingHorizontal: DEFAULT_1x_MARGIN,
            marginTop: DEFAULT_3x_MARGIN,
            width: '100%',
            backgroundColor: theme['color-basic-600'],
            borderRadius: DEFAULT_CORNER_RADIUS,
        },
        actionButtonContainer: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            width: '100%',
            paddingBottom: isSmallScreen() ? 15 : 50,
        },
        infoBox: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginBottom: DEFAULT_2x_MARGIN,
        },
        infoText: {
            color: theme['text-basic-color'],
            fontSize: 14,
            textAlign: 'left',
            flexShrink: 1,
            // marginTop: DEFAULT_1x_MARGIN
        }
    })
}


export default SecurityConfig;