import { StyleSheet } from "react-native";
import { colors, fonts, sizes } from "../../config";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        // alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: sizes.height * .03
    },
    contentBox: {
        // marginTop: sizes.height * .05
    },
    image: {
        width: "100%",
        height: sizes.height * .5,
        resizeMode: 'contain',
        // marginTop: sizes.height * .05,
        marginBottom: sizes.height * .05,
    },
    title: {
        fontFamily: fonts.Poppins_SemiBold,
        fontSize: sizes.text24,
        color: colors.textColor1,
        marginBottom: 4,
        textAlign: 'center',
    },
    description: {
        width: "75%",
        fontFamily: fonts.Poppins_Regular,
        fontSize: sizes.text14,
        color: colors.textColor1,
        marginBottom: sizes.height * .1,
        textAlign: 'center',
        alignSelf: 'center',
    },
   buttonBox: {
    paddingHorizontal: 16,
    marginBottom: 20,
   }
})