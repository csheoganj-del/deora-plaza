package com.deoraplaza.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure WebView for proper mobile viewport handling
        WebSettings webSettings = this.bridge.getWebView().getSettings();
        
        // Enable viewport meta tag
        webSettings.setUseWideViewPort(false);
        webSettings.setLoadWithOverviewMode(false);
        
        // Enable zoom controls (but hide the UI)
        webSettings.setSupportZoom(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        
        // Set initial scale to 100%
        this.bridge.getWebView().setInitialScale(100);
        
        // Enable responsive layout
        webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL);
    }
}
