//  Created by react-native-create-bridge

package com.smsforwarder.checkbackgroundmessages;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;


import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nonnull;

public class CheckBackgroundMessagesModule extends ReactContextBaseJavaModule {
    public static final String REACT_CLASS = "CheckBackgroundMessages";
    private static ReactApplicationContext reactContext;
    private Intent currentServiceIntent;

    public CheckBackgroundMessagesModule(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
        CheckBackgroundMessagesModule.reactContext = reactContext;
    }

    @Nonnull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @ReactMethod
    public void startService() {
            if (currentServiceIntent != null) reactContext.stopService(currentServiceIntent);
            Bundle bundle = new Bundle();
            bundle.putString("foo", "bar");
            currentServiceIntent = new Intent(reactContext, CheckBackgroundMessagesService.class);
            currentServiceIntent.putExtras(bundle);
            reactContext.startService(currentServiceIntent);
    }

    @ReactMethod
    public void stopService() {
        if (currentServiceIntent != null)
            reactContext.stopService(currentServiceIntent);
    }
}
