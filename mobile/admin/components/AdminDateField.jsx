import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Brand } from "@/constants/theme";
import { toDateInputString } from "@/utils/dates";
import { useResponsive } from "@/utils/responsive";

function parseDateValue(value) {
  if (!value) {
    return new Date();
  }

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) {
    return new Date();
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day,
  );

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return new Date();
  }

  return date;
}

export default function AdminDateField({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  minimumDate,
  maximumDate,
  disabled = false,
}) {
  const { moderateScale } =
    useResponsive();

  const [
    showPicker,
    setShowPicker,
  ] = useState(false);

  function openPicker() {
    if (!disabled) {
      setShowPicker(true);
    }
  }

  function handleDateChange(
    event,
    selectedDate,
  ) {
    // Android date picker closes automatically
    // after selecting/cancelling.
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (
      event?.type === "dismissed"
    ) {
      return;
    }

    if (!selectedDate) {
      return;
    }

    onChange?.(
      toDateInputString(
        selectedDate,
      ),
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      {label ? (
        <Text
          style={[
            styles.label,
            {
              fontSize:
                moderateScale(
                  14,
                  0.3,
                ),
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          label
            ? `Select ${label}`
            : "Select date"
        }
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.input,
          {
            minHeight:
              moderateScale(
                50,
                0.2,
              ),
            paddingVertical:
              moderateScale(
                12,
                0.3,
              ),
          },
          disabled &&
            styles.disabled,
          pressed &&
            !disabled &&
            styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.value,
            {
              fontSize:
                moderateScale(
                  16,
                  0.3,
                ),
            },
            !value &&
              styles.placeholder,
          ]}
        >
          {value || placeholder}
        </Text>

        <MaterialIcons
          name="calendar-month"
          size={22}
          color={
            disabled
              ? "#c7bbc4"
              : Brand.plum
          }
        />
      </Pressable>

      {showPicker ? (
        <View
          style={
            styles.pickerContainer
          }
        >
          <DateTimePicker
            value={
              parseDateValue(
                value,
              )
            }
            mode="date"
            display={
              Platform.OS ===
              "android"
                ? "calendar"
                : "spinner"
            }
            minimumDate={
              minimumDate
            }
            maximumDate={
              maximumDate
            }
            onChange={
              handleDateChange
            }
          />

          {Platform.OS ===
          "ios" ? (
            <Pressable
              onPress={() =>
                setShowPicker(
                  false,
                )
              }
              style={
                styles.doneButton
              }
            >
              <Text
                style={
                  styles.doneText
                }
              >
                Done
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap: 6,
    },

    label: {
      fontWeight: "600",
      color: Brand.purple,
    },

    input: {
      borderWidth: 1,
      borderColor: "#d0d0d0",
      borderRadius: 8,
      paddingHorizontal: 14,
      backgroundColor: "#ffffff",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    value: {
      flex: 1,
      color: "#111111",
    },

    placeholder: {
      color: Brand.mauve,
    },

    pressed: {
      borderColor:
        Brand.plum,
      backgroundColor:
        "#fffafd",
    },

    disabled: {
      opacity: 0.5,
    },

    pickerContainer: {
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        "#eadce6",
      borderRadius: 12,
      backgroundColor:
        "#ffffff",
      marginTop: 4,
    },

    doneButton: {
      alignSelf: "flex-end",
      marginRight: 12,
      marginBottom: 10,
      borderRadius: 8,
      backgroundColor:
        Brand.plum,
      paddingHorizontal: 18,
      paddingVertical: 8,
    },

    doneText: {
      color: "#ffffff",
      fontWeight: "700",
    },
  });