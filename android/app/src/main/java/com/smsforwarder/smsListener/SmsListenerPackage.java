package com.smsforwarder.smsListener;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.List;

public class SmsListenerPackage implements ReactPackage {
    static final String TAG = "SmsListenerPackage";

    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext context) {
        return Collections.<NativeModule>singletonList(
                new SmsListenerModule(context)
        );
    }

    // @Override deprecated in RN 0.47
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext context) {
        return Collections.emptyList();
    }
}
