import { useNavigation } from "@react-navigation/native";
import { Button, Card, IndexPath, Input, Layout, Select, SelectItem, Text, TopNavigation, useTheme } from "@ui-kitten/components";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, ImageSourcePropType, ScrollView, StatusBar, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Wallet from "../class/Wallet";
import { BUTTON_FONT_SIZE, DEFAULT_05x_MARGIN, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN, DEFAULT_CORNER_RADIUS, DEFAULT_MODAL_TITLE, DEFAULT_PADDING, SEED_STATUS_MESSAGE, TOAST_POSITION, WALLET_PROVIDERS } from "../utils/constants";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from "react-native-toast-message";
import RNModal from 'react-native-modal';
import StableSafeArea from "../components/safeArea/StableSafeArea";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { analyzeSeed, getMaxNumberFromArray } from "../utils/utils";
import { addNewWallet } from "../redux/WalletSlice";
import PageTitle from "../components/PageTitle";


const AddWallet = React.memo(() => {
    const isDarkMode = useColorScheme() === 'dark';
    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };
    const theme = useTheme();
    const dispatch = useDispatch()
    const navigation = useNavigation()
    const [walletName, setWalletName] = useState<string>('My Wallet');
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [walletSeedPhrase, setWalletSeedPhrase] = useState<string>('');
    const [walletPassword, setWalletPassword] = useState<string>('');
    const [walletProvider, setWalletProvider] = useState(0);
    const [walletProviderImagePath, setWalletProviderImagePath] = useState<ImageSourcePropType>(WALLET_PROVIDERS[0].imagePath);
    const wallets = useSelector((state: any) => state.walletSlice.wallets);
    const premium = useSelector((state: any) => state.accountSlice.premium);
    const uid = useSelector((state: any) => state.accountSlice.uid);
    const securityOption = useSelector((state: any) => state.accountSlice.securityOption);
    const [walleteProviderSelectionModalVisible, setWalleteProviderSelectionModalVisible] = useState(false)
    const [checkSeedStatus, setCheckSeedStatus] = useState(0)

    const selectProviderImagePath = (provider: number | undefined) => {
        let wp = WALLET_PROVIDERS.filter(w => w.id === provider)
        setWalletProviderImagePath(wp.length > 0 ? wp[0].imagePath : WALLET_PROVIDERS[0].imagePath)
    }

    const selectProvider = (provider: number | undefined) => {
        setWalletProvider(provider ?? 0)
        selectProviderImagePath(provider ?? 0)
    }

    const saveNewWallet = () => {

        if (walletSeedPhrase === '' || walletName === '') {
            Toast.show({
                type: 'success',
                position: TOAST_POSITION,
                text1: "Error",
                text2: "At least one mandatory field is missing",
                visibilityTime: 2000,
                autoHide: true,
                topOffset: 30,
                bottomOffset: 40,
                onShow: () => { },
                onHide: () => { },
                onPress: () => { },
                props: { iconName: 'alert' }
            })
            return
        }

        let newWallet = new Wallet({
            provider: walletProvider,
            seed: walletSeedPhrase,
            name: walletName,
            address: walletAddress,
            password: walletPassword,
            id: getMaxNumberFromArray(wallets.map((w: Wallet) => w.id)),
            isDeleted: false,
            createDate: new Date(),
            updateDate: new Date()
        })

        dispatch(addNewWallet({ newWallet: newWallet, securityOption: securityOption, uid: uid }))
        navigation.goBack()
    }

    const setSeedValue = (nextValue: string) => {
        analyzeSeed(nextValue, setCheckSeedStatus)
        setWalletSeedPhrase(nextValue)
    }

    return (

        <>
            <View style={{ flex: 1 }}>
                <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                    backgroundColor={backgroundStyle.backgroundColor}
                />
                <View style={{
                    padding: DEFAULT_PADDING,
                    backgroundColor: theme['color-basic-500'],
                    flex: 1
                }}>

                    <View style={styles().toolbar}>
                        <PageTitle title='New Wallet' />

                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => {
                                saveNewWallet()
                            }}>
                            <MaterialCommunityIcons style={{ marginRight: DEFAULT_05x_MARGIN }} name={'content-save-outline'} size={27} color={theme['text-basic-color']} />
                            <Text style={{ fontWeight: '500', fontSize: 16, color: theme['text-basic-color'] }}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={{
                            borderColor: 'transparent',
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: 20,
                            paddingBottom: 200,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps='handled'>

                        <View style={{ marginBottom: DEFAULT_3x_MARGIN, flexDirection: "row", alignItems: 'center' }}>
                            <TouchableOpacity style={{ marginRight: DEFAULT_2x_MARGIN }}
                                onPress={() => setWalleteProviderSelectionModalVisible(true)}>
                                <Image source={walletProviderImagePath} style={{ width: 60, height: 60, borderRadius: 5, borderWidth: 0, borderColor: theme['color-basic-300'] }} />
                                <View style={{ borderRadius: 50, width: 21, height: 21, backgroundColor: theme['color-primary-500'], position: 'absolute', right: -5, bottom: -5, justifyContent: 'center', alignItems: 'center' }}>
                                    <MaterialCommunityIcons size={13}
                                        color={theme['text-primary-color-button']}
                                        name='pencil'
                                        style={{}} />
                                </View>
                            </TouchableOpacity>

                            <Input
                                value={walletName}
                                textStyle={styles().walletNameTextStyle}
                                // placeholder='Wallet Name*'
                                caption=''
                                size='medium'
                                style={{ paddingHorizontal: 0, paddingVertical: 0, marginVertical: 0, flex: 1, backgroundColor: theme['color-basic-600'], borderWidth: 0, borderColor: theme['color-basic-300'], borderRadius: 8, }}
                                onChangeText={(nextValue: string) => setWalletName(nextValue)}
                                accessoryRight={() => {
                                    return walletName
                                        ? <TouchableOpacity onPress={() => setWalletName('')}>
                                            <MaterialCommunityIcons size={20}
                                                color={theme['text-primary-color-button']}
                                                name='window-close' />
                                        </TouchableOpacity>
                                        : <View />
                                }}
                            />
                        </View>

                        {/* # WALLET SEED PHRASE */}
                        <View style={{ ...styles().inputStyle, ...{ paddingTop: 15, paddingBottom: 10 } }}>
                            <Text style={styles().label}>{'seed phrase'}</Text>
                            <Input
                                value={walletSeedPhrase}
                                textStyle={styles().inputTextStyle}
                                // placeholder='example: sea one rainbow elephant sand phone ...'
                                caption=''
                                multiline={true}
                                size='medium'
                                style={{ ...styles().inputField, ...{ height: 128 } }}
                                onChangeText={(nextValue: string) => setSeedValue(nextValue)}
                                accessoryRight={() => {
                                    return walletSeedPhrase
                                        ? <TouchableOpacity onPress={() => setWalletSeedPhrase('')}>
                                            <MaterialCommunityIcons size={20}
                                                color={theme['text-primary-color-button']}
                                                name='window-close' />
                                        </TouchableOpacity>
                                        : <View />
                                }}
                            />
                        </View>

                        {/* # WALLET ADDRESS */}
                        <View style={{ ...styles().inputStyle, ...{ paddingTop: 15, paddingBottom: 10 } }}>
                            <Text style={styles().label}>{'wallet address (optional)'}</Text>
                            <Input
                                value={walletAddress}
                                textStyle={styles().inputTextStyle}
                                // placeholder='example: 0x71C7656EC7ab88b098defB75...'
                                caption=''
                                size='small'
                                style={styles().inputField}
                                onChangeText={(nextValue: string) => setWalletAddress(nextValue)}
                                accessoryRight={() => {
                                    return walletAddress
                                        ? <TouchableOpacity onPress={() => setWalletAddress('')}>
                                            <MaterialCommunityIcons size={20}
                                                color={theme['text-primary-color-button']}
                                                name='window-close' />
                                        </TouchableOpacity>
                                        : <View />
                                }}
                            />
                        </View>

                        {/* # WALLET PASSWORD */}
                        <View style={{ ...styles().inputStyle, ...{ paddingTop: 15, paddingBottom: 10 } }}>
                            <Text style={styles().label}>{'wallet password (optional)'}</Text>
                            <Input
                                value={walletPassword}
                                textStyle={styles().inputTextStyle}
                                // placeholder='example: A*43hbRT/3r52f'
                                caption=''
                                size='small'
                                style={styles().inputField}
                                onChangeText={(nextValue: string) => setWalletPassword(nextValue)}
                                accessoryRight={() => {
                                    return walletPassword
                                        ? <TouchableOpacity onPress={() => setWalletPassword('')}>
                                            <MaterialCommunityIcons size={20}
                                                color={theme['text-primary-color-button']}
                                                name='window-close' />
                                        </TouchableOpacity>
                                        : <View />
                                }}
                            />
                        </View>

                    </ScrollView>

                    {/* Staus message */}
                    <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginBottom: DEFAULT_2x_MARGIN }}>
                        <MaterialCommunityIcons style={{ marginRight: DEFAULT_05x_MARGIN }} name={'circle'} size={10} color={SEED_STATUS_MESSAGE[checkSeedStatus].color} />
                        <Text style={{ fontWeight: '500', fontSize: 12, color: theme['text-basic-color'] }}>{SEED_STATUS_MESSAGE[checkSeedStatus].message}</Text>
                    </View>

                    <RNModal
                        isVisible={walleteProviderSelectionModalVisible}
                        onBackdropPress={() => setWalleteProviderSelectionModalVisible(false)}
                        onSwipeComplete={() => setWalleteProviderSelectionModalVisible(false)}
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

                            <View style={styles().settingsBox}>
                                <ScrollView
                                    contentContainerStyle={{ display: 'flex', flexDirection: 'row', width: '100%', flexWrap: 'wrap', justifyContent: 'space-between' }}
                                >
                                    {
                                        WALLET_PROVIDERS.map((item) => {
                                            return <TouchableOpacity style={{
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                marginRight: 10,
                                                marginBottom: 10,
                                                width: 75,
                                                height: 75,
                                                borderRadius: 10,
                                                borderWidth: item.id === walletProvider ? 2 : 0.5,
                                                paddingVertical: 4,
                                                backgroundColor: theme['color-basic-200'],
                                                borderColor: item.id === walletProvider ? theme['color-primary-500'] : theme['color-basic-300'],
                                            }}
                                                key={item.id}
                                                onPress={(e) => {
                                                    selectProvider(item.id)
                                                }}>

                                                <Image source={item.imagePath} style={{ width: 40, height: 40, borderRadius: 5, }} />
                                                <Text style={{ fontSize: 9, marginTop: 5, textTransform: 'capitalize', textAlign: 'center' }}>{item.name}</Text>
                                            </TouchableOpacity>

                                        })}
                                </ScrollView>
                            </View>

                            <Button
                                style={{ width: '100%', marginBottom: 25, borderRadius: DEFAULT_CORNER_RADIUS, backgroundColor: theme['background-color-button'], borderWidth: 0 }}
                                onPress={() => {
                                    setWalleteProviderSelectionModalVisible(false)
                                }}>
                                {props => <Text {...props} style={{ color: theme['fab-text-color'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                                    {'Close Menu'}
                                </Text>}
                            </Button>
                        </Card>

                    </RNModal>
                </View>
            </View>

        </>
    );
});

const styles = () => {
    const theme = useTheme();

    return StyleSheet.create({
        inputTextStyle: {
            fontSize: 16,
            color: theme['text-basic-color'],
        },
        walletNameTextStyle: {
            marginHorizontal: 0,
            paddingHorizontal: 0,
            fontSize: 21,
            fontWeight: '600',
        },
        inputStyle: {
            marginBottom: DEFAULT_2x_MARGIN,
            paddingHorizontal: DEFAULT_1x_MARGIN,
            paddingTop: DEFAULT_1x_MARGIN,
            borderWidth: 0,
            borderColor: theme['color-basic-300'],
            borderRadius: 8,
            alignItems: 'flex-start',
            flexDirection: 'column',
            justifyContent: 'center',
            display: 'flex',
            backgroundColor: theme['color-basic-600'],
        },
        label: {
            fontSize: 15,
            fontWeight: '400',
            marginLeft: 12,
            color: theme['color-primary-500']
        },
        copyLabel: {
            fontSize: 12,
            fontWeight: '700',
            color: theme['text-basic-color']
        },
        settingsBox: {
            display: 'flex',
            width: '100%',
            borderRadius: DEFAULT_CORNER_RADIUS,
            paddingVertical: 0,
            marginBottom: 20,
        },
        copyCell: {
            flex: 1
        },
        toolbar: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: DEFAULT_3x_MARGIN
        },
        inputField: {
            borderWidth: 0,
            paddingHorizontal: 0,
            marginHorizontal: -3.5,
            paddingVertical: 0,
            marginVertical: 0,
            marginTop: 0,
        }
    });
}


export default AddWallet;
