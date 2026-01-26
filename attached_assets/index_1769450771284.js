import { View, Text, Image } from 'react-native'
import React, { useState } from 'react'
import styles from './styles'
import { images, routes } from '../../config'
import AppButton from '../../components/AppButton'
import DoubleBackPressExit from '../../components/DoubleBackPressExit'
import FastImageBox from '../../components/FastImageBox'
import { useTranslation } from 'react-i18next'

const PaymentStatus = ({ navigation, route }) => {
    const { t } = useTranslation();
    DoubleBackPressExit()

    return (
        <View style={styles.container}>
            {route?.params?.status == 'success' ?
                <>
                    <View style={styles.contentBox}>
                        <FastImageBox source={images.paymentSuccess} style={styles.image} />
                        <Text style={styles.title}>{t("Congratulations")}!</Text>
                        <Text style={styles.description}>{t("paymentSuccess")}</Text>
                    </View>
                    <View style={styles.buttonBox}>
                        <AppButton text={t("Continue")} onPress={() => {
                            if (route?.params?.from == 'subscription') {
                                navigation.pop(3)
                            } else {
                                navigation.pop(2)
                            }
                        }} />
                    </View>
                </>
                :
                <>
                    <View style={styles.contentBox}>
                        <FastImageBox source={images.paymentFail} style={styles.image} />
                        <Text style={styles.title}>{t("Payment Failed")}</Text>
                        <Text style={styles.description}>{t("paymentFail")}</Text>
                    </View>
                    <View style={styles.buttonBox}>
                        <AppButton text={t("Try Again")} onPress={() => navigation.pop(2)} />
                    </View>
                </>
            }

        </View>
    )
}

export default PaymentStatus