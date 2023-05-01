//
//  SceneDelegate.swift
//  CryptoWarden
//
//  Created by Tommaso Carpi on 08/01/23.
//

import UIKit
import Firebase
#if targetEnvironment(macCatalyst)
import Dynamic
#endif

class HomeViewController: UIViewController {
  
  let appDelegate = UIApplication.shared.delegate as! AppDelegate
  
  override func becomeFirstResponder() -> Bool {
    true
  }
  
  
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    view.backgroundColor = .black
    
#if targetEnvironment(macCatalyst)
    Dynamic(self.view.window?.nsWindow).standardWindowButton(2).isHidden = true
#endif
  }
  
  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
  }
  
  override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
  }
  
}

@available(iOS 13.0, *)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  
#if targetEnvironment(macCatalyst)
  let statusItem = Dynamic.NSStatusBar.systemStatusBar.statusItemWithLength(-1.0)
#endif
  
  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    
    if let windowScene = scene as? UIWindowScene {
      
      let jsCodeLocation: URL
      
      jsCodeLocation = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index", fallbackExtension: nil)
      let rootView = RCTRootView(bundleURL: jsCodeLocation, moduleName: "CryptoWarden", initialProperties: nil, launchOptions: nil)
      let rootViewController = HomeViewController()
      rootViewController.view = rootView
      
      self.window = UIWindow(windowScene: windowScene)
      self.window?.rootViewController = rootViewController
      self.window?.makeKeyAndVisible()
      
      
#if targetEnvironment(macCatalyst)
      if let titlebar = windowScene.titlebar {
        titlebar.titleVisibility = .hidden
        titlebar.toolbar = nil
      }
      
      UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.forEach { windowScene in
        windowScene.sizeRestrictions?.minimumSize = CGSize(width: 450, height: 900)
        windowScene.sizeRestrictions?.maximumSize = CGSize(width: 450, height: 1800)
      }
#endif
    }
    
  }
  
  func scene(_ scene: UIScene, openURLContexts urlContexts: Set<UIOpenURLContext>) {
    
    if let urlContext = urlContexts.first {
      let url = urlContext.url
      EventEmitter.emitter?.sendEvent(withName: "url", body: url.absoluteString)
    }
    
  }
}
  
#if targetEnvironment(macCatalyst)
  extension UIWindow {
    var nsWindow: NSObject? {
      var nsWindow = Dynamic.NSApplication.sharedApplication.delegate.hostWindowForUIWindow(self)
      if #available(macOS 11, *) {
        nsWindow = nsWindow.attachedWindow
      }
      return nsWindow.asObject
    }
  }

#endif
