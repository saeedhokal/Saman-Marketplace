import UIKit
import Capacitor

class NoBounceViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Disable scroll bounce on the webview
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.disableScrollBounce()
        }
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        disableScrollBounce()
    }
    
    private func disableScrollBounce() {
        // Find the WKWebView's scroll view and disable bouncing
        if let webView = self.webView {
            webView.scrollView.bounces = false
            webView.scrollView.alwaysBounceVertical = false
            webView.scrollView.alwaysBounceHorizontal = false
            webView.scrollView.contentInsetAdjustmentBehavior = .never
        }
    }
}
