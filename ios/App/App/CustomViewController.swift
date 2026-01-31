import UIKit
import Capacitor

class CustomViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let darkColor = UIColor(red: 15/255, green: 19/255, blue: 24/255, alpha: 1.0)
        
        view.backgroundColor = darkColor
        webView?.backgroundColor = darkColor
        webView?.isOpaque = false
        webView?.scrollView.backgroundColor = darkColor
    }
}
