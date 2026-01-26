import { View, Text, SafeAreaView, ScrollView, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import styles from './styles'
import AppHeader from '../../components/AppHeader'
import Icons from '../../components/Icons'
import { colors, images, routes } from '../../config'
import AppButton from '../../components/AppButton'
import CancelSubscriptionModal from '../../components/CancelSubscriptionModal'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { SagaActions } from '../../redux/sagas/SagaActions'
import Loading from '../../components/Loading'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'

const Tab = createMaterialTopTabNavigator()

const MyTab = () => {

    const { t } = useTranslation()

    return (
        <Tab.Navigator
            screenOptions={{
                // swipeEnabled: false,
                tabBarActiveTintColor: colors.basecolor,
                tabBarInactiveTintColor: '#DDE5E9',
                tabBarStyle: {
                    backgroundColor: colors.bg,
                    // elevation: 0,
                },
                tabBarIndicatorStyle: {
                    backgroundColor: colors.basecolor,
                }
            }}
        >
            <Tab.Screen
                name={routes.AUTOMOTIVES}
                component={Automotives}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={[styles.label, focused ? styles.activeLabel : styles.label]}>
                            {t("Automotives")}
                        </Text>
                    ),
                }}
            />

            <Tab.Screen
                name={routes.SPAREPARTS}
                component={Spareparts}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={[styles.label, focused ? styles.activeLabel : styles.label]}>
                            {t("Spareparts")}
                        </Text>
                    ),
                }}
            />
        </Tab.Navigator>
    )
}

const Automotives = ({ navigation, route }) => {
    const [visible, setVisible] = useState(false)
    const [loading, setLoading] = useState(false)

    const { t } = useTranslation();
    const dispatch = useDispatch()
    const getMySubscription = useSelector(state => state.subscriptionReducer?.getMySubscription);

    const subscriptionData = getMySubscription?.subscriptions?.find(item => item?.subscription?.type == "AutoMative")

    useEffect(() => {
        dispatch({
            type: SagaActions.GET_MY_SUBSCRIPTION,
            payload: {},
            loading: (data) => setLoading(data)
        })
    }, [])

    console.log("getMySubscription: ", getMySubscription?.subscriptions)

    return (
        <SafeAreaView style={styles.container}>

            {loading ? <Loading /> :
                subscriptionData ?
                    <>
                        <ScrollView style={{ flex: 1, }}>

                            <View style={{ paddingHorizontal: 16 }} >
                                <View style={styles.contentBox}>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.title} numberOfLines={2}>{subscriptionData?.subscription?.name}</Text>
                                        <Text style={styles.price}>{t("AED")} {subscriptionData?.amount}</Text>
                                    </View>

                                    {/* {subscriptionData?.subscription?.feature?.map((item, index) => (
                                        <View style={styles.featureRow} key={index}>
                                            <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                            <Text style={styles.featureText}>{item?.name}</Text>
                                        </View>
                                    ))} */}
                                    <View style={styles.featureRow}>
                                        <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                        <Text style={[styles.featureText, { color: colors.textColor1 }]}>{t("Up to")} {subscriptionData?.subscription?.productLimit} {t("ADS")} {"("} {subscriptionData?.subscription?.productLimit} {t("Listings")}{")"}</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                        <Text style={[styles.featureText, { color: colors.textColor1 }]}>{t("Total Credit")} {subscriptionData?.subscription?.credit}</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                        <Text style={[styles.featureText, { color: colors.textColor1 }]}>{t("Validity for each Ad is 30 days")}</Text>
                                    </View>
                                    {/* <View style={styles.featureRow}>
                                        <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                        <Text style={[styles.featureText, { color: colors.textColor1 }]}>{t("Validity of 30 days")}</Text>
                                    </View> */}
                                </View>

                                <View style={styles.warnBox}>
                                    <View style={{ backgroundColor: colors.white, borderRadius: 50, padding: 5, alignSelf: 'center' }}> <Icons src={images.info} size={24} /></View>
                                    <Text style={styles.warnTitle}>{t("Your Premium plan will end on")} {moment(subscriptionData?.validity, "YYYY-MM-DD").format("DD MMM, YYYY")} {t("at")} {moment(subscriptionData?.validity, "YYYY-MM-DD HH:mm").format("hh:mm A")}</Text>
                                    <Text style={styles.warnText}>{t("After that, you will be automatically billed")} {t("AED")} {subscriptionData?.amount}</Text>
                                </View>

                                <View style={styles.keyRow}>
                                    <Text style={styles.key}>{t("Next Payment")}</Text>
                                    <Text style={styles.value}>{moment(subscriptionData?.validity, "YYYY-MM-DD").format("DD MMM, YYYY")}</Text>
                                </View>
                                <View style={styles.keyRow}>
                                    <Text style={styles.key}>{t("Payment Method")}</Text>
                                    <Icons src={images.paymethod} size={29} style={{ width: 29, height: 18 }} />
                                </View>
                                <View style={styles.keyRow}>
                                    <Text style={styles.key}>{t("Total")}</Text>
                                    <Text style={styles.value}>{t("AED")} {subscriptionData?.amount}</Text>
                                </View>
                                <View style={styles.keyRow}>
                                    <Text style={styles.key}>{t("Total Credit")}</Text>
                                    <Text style={styles.value}>{subscriptionData?.subscription?.credit}</Text>
                                </View>
                            </View>
                        </ScrollView>
                        <View style={styles.buttonBox}>
                            <AppButton text={t('Cancel Plan')} buttonStyle={{ width: '45%', backgroundColor: colors.white, borderRadius: 6 }} textStyle={{ color: colors.basecolor }}
                                onPress={() => setVisible(true)}
                            />
                            <AppButton text={t('Upgrade Plan')} buttonStyle={{ width: '45%', borderRadius: 6 }} onPress={() => navigation.navigate(routes.SUBSCRIPTION, { screen: routes.AUTOMOTIVES })} />
                        </View>
                    </>
                    :
                    <View style={styles.nodata}>
                        <Text style={styles.noText}>{t("No Subscription")}</Text>
                    </View>
            }

            <CancelSubscriptionModal visible={visible} onClose={() => setVisible(false)}
                id={subscriptionData?._id}
                planText={`${t("Your Premium plan will end on")} ${moment(subscriptionData?.validity, "YYYY-MM-DD").format("DD MMM, YYYY")} ${t("at")} ${moment(subscriptionData?.validity, "YYYY-MM-DD HH:mm").format("hh:mm A")}`}
            />
        </SafeAreaView>
    )
}

const Spareparts = ({ navigation, route }) => {
    const [visible, setVisible] = useState(false)

    const { t } = useTranslation();
    const getMySubscription = useSelector(state => state.subscriptionReducer?.getMySubscription);

    const subscriptionData = getMySubscription?.subscriptions?.find(item => item?.subscription?.type == "Spare Parts")


    // console.log("userData: ", subscriptionData)

    return (
        <SafeAreaView style={styles.container}>
            {subscriptionData ?
                <>
                    <ScrollView style={{ flex: 1, }}>
                        <View style={{ paddingHorizontal: 16 }} >
                            <View style={styles.contentBox}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.title} numberOfLines={2}>{subscriptionData?.subscription?.name}</Text>
                                    <Text style={styles.price}>{t("AED")} {subscriptionData?.amount}</Text>
                                </View>

                                {/* {subscriptionData?.subscription?.feature?.map((item, index) => (
                                    <View style={styles.featureRow} key={index}>
                                        <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                        <Text style={styles.featureText}>{item?.name}</Text>
                                    </View>
                                ))} */}
                                <View style={styles.featureRow}>
                                    <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                    <Text style={[styles.featureText, { color: colors.textColor1 }]}>{t("Up to")} {subscriptionData?.subscription?.productLimit} {t("ADS")} {"("} {subscriptionData?.subscription?.productLimit} {t("Listings")}{")"}</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                    <Text style={[styles.featureText, { color: colors.textColor1 }]}>{t("Total Credit")} {subscriptionData?.subscription?.credit}</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                    <Text style={[styles.featureText, { color: colors.textColor1 }]}>{t("Validity for each Ad is 30 days")}</Text>
                                </View>
                                {/* <View style={styles.featureRow}>
                                    <Icons src={images.checkIcon} size={20} color={colors.textColor1} />
                                    <Text style={[styles.featureText, { color: colors.textColor1 }]}>{t("Validity of 30 days")}</Text>
                                </View> */}
                            </View>

                            <View style={styles.warnBox}>
                                <View style={{ backgroundColor: colors.white, borderRadius: 50, padding: 5, alignSelf: 'center' }}> <Icons src={images.info} size={24} /></View>
                                <Text style={styles.warnTitle}>{t("Your Premium plan will end on")} {moment(subscriptionData?.validity, "YYYY-MM-DD").format("DD MMM, YYYY")} {t("at")} {moment(subscriptionData?.validity, "YYYY-MM-DD HH:mm").format("hh:mm A")}</Text>
                                <Text style={styles.warnText}>{t("After that, you will be automatically billed")} {t("AED")} {subscriptionData?.amount}</Text>
                            </View>

                            <View style={styles.keyRow}>
                                <Text style={styles.key}>{t("Next Payment")}</Text>
                                <Text style={styles.value}>{moment(subscriptionData?.validity, "YYYY-MM-DD").format("DD MMM, YYYY")}</Text>
                            </View>
                            <View style={styles.keyRow}>
                                <Text style={styles.key}>{t("Payment Method")}</Text>
                                <Icons src={images.paymethod} size={29} style={{ width: 29, height: 18 }} />
                            </View>
                            <View style={styles.keyRow}>
                                <Text style={styles.key}>{t("Total")}</Text>
                                <Text style={styles.value}>{t("AED")} {subscriptionData?.amount}</Text>
                            </View>
                            <View style={styles.keyRow}>
                                <Text style={styles.key}>{t("Total Credit")}</Text>
                                <Text style={styles.value}>{subscriptionData?.subscription?.credit}</Text>
                            </View>
                        </View>
                    </ScrollView>
                    <View style={styles.buttonBox}>
                        <AppButton text={t('Cancel Plan')} buttonStyle={{ width: '45%', backgroundColor: colors.white, borderRadius: 6 }} textStyle={{ color: colors.basecolor }}
                            onPress={() => setVisible(true)}
                        />
                        <AppButton text={t('Upgrade Plan')} buttonStyle={{ width: '45%', borderRadius: 6 }} onPress={() => navigation.navigate(routes.SUBSCRIPTION, { screen: routes.SPAREPARTS })} />
                    </View>
                </>
                :
                <View style={styles.nodata}>
                    <Text style={styles.noText}>{t("No Subscription")}</Text>
                </View>
            }
            <CancelSubscriptionModal visible={visible} onClose={() => setVisible(false)}
                id={subscriptionData?._id}
                planText={`${t("Your Premium plan will end on")} ${moment(subscriptionData?.validity, "YYYY-MM-DD").format("DD MMM, YYYY")} ${t("at")} ${moment(subscriptionData?.validity, "YYYY-MM-DD HH:mm").format("hh:mm A")}`}
            />
        </SafeAreaView>
    )
}

const MySubscription = ({ navigation, route }) => {

    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.containerBox}>
            <AppHeader title={t("My Subscription")} />

            {MyTab()}

        </SafeAreaView>
    )
}

export default MySubscription