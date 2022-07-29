//  Created by react-native-create-bridge

package com.smsforwarder.checkbackgroundmessages;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class CheckBackgroundMessagesPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
      // Register your native module
      // https://facebook.github.io/react-native/docs/native-modules-android.html#register-the-module
      return Collections.<NativeModule>singletonList(
              new CheckBackgroundMessagesModule(reactContext)
      );
    }

    
    @NonNull
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
