#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <Firebase.h> // Import Firebase

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKit/FlipperKit.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  [client start];
}
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

  // Initialize Firebase
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }

  // Create React Native bridge and root view
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:[self sourceURLForBridge:nil]
                                            moduleProvider:nil
                                             launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"userapp1"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0 green:1.0 blue:1.0 alpha:1.0];

  // Setup main window
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
#if DEBUG
  // Ensure the correct method is used for React Native version 0.74.3
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];

#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
