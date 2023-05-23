import { useNavigation } from "@react-navigation/native";
import { Button, Card, Input, Text, useTheme } from "@ui-kitten/components";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, ImageSourcePropType, ScrollView, StatusBar, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Wallet from "../class/Wallet";
import ModalContainer from "../components/ModalContainer";
import WalletProvidersOverflowMenu from "../components/WalletProvidersOverflowMenu";
import { updateWallet } from "../redux/WalletSlice";
import { BUTTON_FONT_SIZE, DEFAULT_05x_MARGIN, DEFAULT_1x_MARGIN, DEFAULT_2x_MARGIN, DEFAULT_3x_MARGIN, DEFAULT_CORNER_RADIUS, DEFAULT_MODAL_TITLE, DEFAULT_PADDING, SEED_STATUS_MESSAGE, TOAST_POSITION, WALLET_PROVIDERS } from "../utils/constants";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from "react-native-toast-message";
import RNModal from 'react-native-modal';
import StableSafeArea from "../components/safeArea/StableSafeArea";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { ImageSource } from "react-native-vector-icons/Icon";
import PageTitle from "../components/PageTitle";
import { analyzeSeed } from "../utils/utils";

const WalletDetails = React.memo(() => {
    const theme = useTheme();
    const dispatch = useDispatch()
    const navigation = useNavigation()
    const [walletName, setWalletName] = useState<string>('');
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [walletSeedPhrase, setWalletSeedPhrase] = useState<string>('');
    const [walletPassword, setWalletPassword] = useState<string>('');
    const [walletProvider, setWalletProvider] = useState(0);
    const [walletCreateDate, setWalletCreateDate] = useState(new Date());
    const [walletProviderImagePath, setWalletProviderImagePath] = useState<ImageSourcePropType>(WALLET_PROVIDERS[0].imagePath);
    const [walletId, setWalletId] = useState(-1);
    const [secureEntryForPassword, setSecureEntryForPassword] = useState(true);
    const [secureEntryForSeed, setSecureEntryForSeed] = useState(true);
    const selectedWallet = useSelector((state: any) => state.walletSlice.selectedWallet);
    const [deletionModalVisible, setDeletionModalVisible] = useState(false)
    const [seedphraseCopy, setSeedphraseCopy] = useState(false)
    const [passwordCopy, setPasswordCopy] = useState(false)
    const [addressCopy, setAddressCopy] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [walleteProviderSelectionModalVisible, setWalleteProviderSelectionModalVisible] = useState(false)
    const [checkSeedStatus, setCheckSeedStatus] = useState(0)

    useEffect(() => {
        setWalletName(selectedWallet.name)
        setWalletAddress(selectedWallet.address)
        setWalletSeedPhrase(selectedWallet.seed)
        setWalletPassword(selectedWallet.password)
        setWalletProvider(selectedWallet.provider)
        setWalletId(selectedWallet.id)
        setWalletCreateDate(selectedWallet.createDate)

        selectProviderImagePath(selectedWallet.provider)

        analyzeSeed(selectedWallet.seed, setCheckSeedStatus)
    }, [])

    useEffect(() => {
        if (seedphraseCopy) {
            setTimeout(() => {
                setSeedphraseCopy(false)
            }, 1000);
        }

        if (addressCopy) {
            setTimeout(() => {
                setAddressCopy(false)
            }, 1000);
        }

        if (passwordCopy) {
            setTimeout(() => {
                setPasswordCopy(false)
            }, 1000);
        }
    }, [seedphraseCopy, addressCopy, passwordCopy])

    const selectProviderImagePath = (provider: number | undefined) => {
        let wp = WALLET_PROVIDERS.filter(w => w.id === provider)
        setWalletProviderImagePath(wp.length > 0 ? wp[0].imagePath : WALLET_PROVIDERS[0].imagePath)
    }
    const selectProvider = (provider: number | undefined) => {
        setWalletProvider(provider ?? 0)
        selectProviderImagePath(provider ?? 0)
    }

    const update = (isDeleted: boolean = false) => {
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

        let updatedWallet = new Wallet({
            provider: walletProvider,
            seed: walletSeedPhrase,
            name: walletName,
            address: walletAddress,
            password: walletPassword,
            id: walletId,
            isDeleted: isDeleted,
            createDate: walletCreateDate,
            updateDate: new Date()
        })

        dispatch(updateWallet({ updatedWallet: updatedWallet }))
    }

    const deleteWallet = () => {
        update(true)
        navigation.goBack()
    }

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text)
    }

    return (

        <>
            <View style={{ flex: 1 }}>

                <View style={{
                    padding: DEFAULT_PADDING,
                    backgroundColor: theme['color-basic-500'],
                    flex: 1
                }}>

                    <View style={styles().toolbar}>
                        <PageTitle title='Wallet Details' />

                        {
                            editMode
                                ? <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', }}
                                    onPress={() => {
                                        setEditMode(false)
                                        update()
                                    }}>
                                    <MaterialCommunityIcons style={{ marginRight: DEFAULT_05x_MARGIN }} name={'content-save-outline'} size={27} color={theme['text-basic-color']} />
                                    <Text style={{ fontWeight: '500', fontSize: 16 }}>Save</Text>
                                </TouchableOpacity>
                                : <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => setEditMode(true)}>
                                    <MaterialCommunityIcons style={{ marginRight: DEFAULT_05x_MARGIN }} name={'square-edit-outline'} size={27} color={theme['text-basic-color']} />
                                    <Text style={{ fontWeight: '500', fontSize: 16 }}>Edit</Text>
                                </TouchableOpacity>
                        }
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
                                disabled={!editMode}
                                onPress={() => setWalleteProviderSelectionModalVisible(true)}>
                                <Image source={walletProviderImagePath} style={{ width: 60, height: 60, borderRadius: 5, borderWidth: 0, borderColor: theme['color-basic-300'] }} />
                                {editMode
                                    ? <View style={{ borderRadius: 50, width: 21, height: 21, backgroundColor: theme['color-primary-500'], position: 'absolute', right: -5, bottom: -5, justifyContent: 'center', alignItems: 'center' }}>
                                        <MaterialCommunityIcons size={13}
                                            color={theme['text-primary-color-button']}
                                            name='pencil'
                                            style={{}} />
                                    </View>
                                    : undefined
                                }
                            </TouchableOpacity>
                            {
                                editMode
                                    ? <Input
                                        value={walletName}
                                        textStyle={styles().walletNameTextStyle}
                                        caption=''
                                        size='medium'
                                        style={{ borderWidth: 0, paddingHorizontal: 0, paddingVertical: 0, marginVertical: 0, backgroundColor: theme['color-basic-600'], flex: 1 }}
                                        accessoryRight={() => <TouchableOpacity onPress={() => setWalletName('')}>
                                            <MaterialCommunityIcons size={20}
                                                color={theme['text-primary-color-button']}
                                                name='window-close' />
                                        </TouchableOpacity>}
                                        onChangeText={(nextValue: string) => setWalletName(nextValue)}
                                    />
                                    : <Text style={styles().walletNameTextStyle}> {walletName} </Text>
                            }
                        </View>

                        {/* # WALLET SEED PHRASE */}
                        <View style={{ ...styles().textStyle, ...{ backgroundColor: seedphraseCopy ? theme['color-primary-500'] : theme['color-basic-600'], }, ...styles().cellAdjustments }}>
                            <TouchableOpacity style={styles().copyCell} onPress={() => {
                                copyToClipboard(walletSeedPhrase)
                                setSeedphraseCopy(true)
                            }}>
                                {
                                    seedphraseCopy
                                        ? <Text style={styles().copyLabel}>{'COPIED'}</Text>
                                        : <Text style={styles().label}>{'seed phrase'}</Text>
                                }
                                <Text style={{ ...styles().inputTextStyle, ...{ fontSize: secureEntryForSeed ? 7 : 16 }, ...styles().textAdjustments, ...styles().cellAdjustments }}>{secureEntryForSeed ? '⬤ ⬤ ⬤ ⬤ ⬤ ⬤' : walletSeedPhrase}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={{}} onPress={() => {
                                setSecureEntryForSeed(!secureEntryForSeed)
                                setWalletSeedPhrase(walletSeedPhrase)
                            }}>
                                <MaterialCommunityIcons size={20}
                                    color={theme['color-primary-500']}
                                    name='eye' />
                            </TouchableOpacity>
                        </View>

                        {/* # WALLET ADDRESS */}
                        {
                            editMode ?
                                <View style={{ ...styles().inputStyle, ...styles().cellAdjustments }}>
                                    <Text style={styles().label}>{'wallet address'}</Text>
                                    <Input
                                        value={walletAddress}
                                        textStyle={styles().inputTextStyle}
                                        caption=''
                                        size='small'
                                        style={styles().inputField}
                                        onChangeText={(nextValue: string) => setWalletAddress(nextValue)}
                                        accessoryRight={() => <TouchableOpacity onPress={() => setWalletAddress('')}>
                                            <MaterialCommunityIcons size={20}
                                                color={theme['text-primary-color-button']}
                                                name='window-close' />
                                        </TouchableOpacity>}
                                    />
                                </View>
                                : walletAddress ?
                                    <View style={{ ...styles().textStyle, ...{ backgroundColor: addressCopy ? theme['color-primary-500'] : theme['color-basic-600'], }, ...styles().cellAdjustments }}>
                                        <TouchableOpacity style={styles().copyCell} onPress={() => {
                                            copyToClipboard(walletPassword)
                                            setAddressCopy(true)
                                        }}>
                                            {
                                                addressCopy
                                                    ? <Text style={styles().copyLabel}>{'COPIED'}</Text>
                                                    : <Text style={styles().label}>{'wallet address'}</Text>
                                            }
                                            <Text style={{ ...styles().inputTextStyle, ...styles().textAdjustments, ...styles().cellAdjustments }}>{walletAddress}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    : undefined
                        }

                        {/* # WALLET PASSWORD */}
                        {
                            editMode ?
                                <View style={{ ...styles().inputStyle, ...styles().cellAdjustments }}>
                                    <Text style={styles().label}>{'wallet password'}</Text>
                                    <Input
                                        value={walletPassword}
                                        textStyle={styles().inputTextStyle}
                                        caption=''
                                        size='small'
                                        style={styles().inputField}
                                        onChangeText={(nextValue: string) => setWalletPassword(nextValue)}
                                        accessoryRight={() => <TouchableOpacity onPress={() => setWalletPassword('')}>
                                            <MaterialCommunityIcons size={20}
                                                color={theme['text-primary-color-button']}
                                                name='window-close' />
                                        </TouchableOpacity>}
                                    />
                                </View>
                                : walletPassword ?
                                    <View style={{ ...styles().textStyle, ...{ backgroundColor: passwordCopy ? theme['color-primary-500'] : theme['color-basic-600'], }, ...styles().cellAdjustments }}>
                                        <TouchableOpacity style={styles().copyCell} onPress={() => {
                                            copyToClipboard(walletPassword)
                                            setPasswordCopy(true)
                                        }}>
                                            {
                                                passwordCopy
                                                    ? <Text style={styles().copyLabel}>{'COPIED'}</Text>
                                                    : <Text style={styles().label}>{'password'}</Text>
                                            }
                                            <Text style={{ ...styles().inputTextStyle, ...{ fontSize: secureEntryForPassword ? 7 : 16 }, ...styles().textAdjustments, ...styles().cellAdjustments }}>{secureEntryForPassword ? '⬤ ⬤ ⬤ ⬤ ⬤ ⬤' : walletPassword}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => {
                                            setSecureEntryForPassword(!secureEntryForPassword)
                                        }}>
                                            <MaterialCommunityIcons size={20}
                                                color={theme['color-primary-500']}
                                                name='eye' />
                                        </TouchableOpacity>
                                    </View>
                                    : undefined
                        }

                    </ScrollView>

                    {
                        editMode ?
                            <Button
                                style={{ width: '50%', alignSelf: 'center', marginTop: DEFAULT_3x_MARGIN, borderRadius: DEFAULT_CORNER_RADIUS, borderColor: theme['delete-button-background'], borderWidth: 1, backgroundColor: theme['delete-button-background'], marginBottom:DEFAULT_3x_MARGIN }}
                                onPress={() => setDeletionModalVisible(true)}>
                                {props => <Text {...props} style={{ color: theme['delete-button-text'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE - 3 }}>
                                    {`Delete Wallet`}
                                </Text>}
                            </Button>
                            : undefined
                    }


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
                                {props => <Text {...props} style={{ color: theme['text-primary-color-button'], fontWeight: '600', fontSize: BUTTON_FONT_SIZE }}>
                                    {'Close Menu'}
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

                            <Text style={{ color: theme['text-basic-color'], fontSize: DEFAULT_MODAL_TITLE, fontWeight: '600', marginBottom: 30, textAlign: 'center' }}>{"Are you sure you want to delete this wallet?"}</Text>

                            <Button
                                style={{ width: '100%', marginTop: 30, borderRadius: DEFAULT_CORNER_RADIUS, backgroundColor: theme['background-color-button'], borderWidth: 0 }}
                                onPress={() => {
                                    setDeletionModalVisible(false)
                                    deleteWallet()
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
            fontWeight: '600'
        },
        inputStyle: {
            marginBottom: DEFAULT_1x_MARGIN,
            paddingHorizontal: DEFAULT_1x_MARGIN,
            paddingTop: DEFAULT_1x_MARGIN,
            borderWidth: 0,
            borderColor: theme['color-basic-300'],
            borderRadius: 4,
            alignItems: 'flex-start',
            flexDirection: 'column',
            justifyContent: 'center',
            display: 'flex',
            backgroundColor: theme['color-basic-600'],
        },
        textStyle: {
            marginBottom: DEFAULT_1x_MARGIN,
            paddingHorizontal: DEFAULT_1x_MARGIN,
            paddingTop: DEFAULT_1x_MARGIN,
            borderWidth: 0,
            borderColor: theme['color-basic-300'],
            borderRadius: 4,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
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
            fontSize: 15,
            fontWeight: '700',
            marginLeft: 12,
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
        },
        textAdjustments: {
            // paddingVertical: 10,
            marginLeft: 12
        },
        cellAdjustments: {
            paddingTop: 10,
            paddingBottom: 10
        }
    });
}


export default WalletDetails;