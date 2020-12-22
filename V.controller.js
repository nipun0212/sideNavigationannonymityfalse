sap.ui.define([
                             'jquery.sap.global',
                             'sap/ui/core/mvc/Controller',
                             "sap/m/MessageToast"
              ], function(jQuery, Controller, MessageToast) {
              "use strict";
 
              return Controller.extend("sap.tnt.sample.SideNavigation.V", {
 
                             onCollapseExpandPress: function () {
                                           var customValue = "";
                                           if(window.location.href.indexOf("customEvent")>-1){
                                           customValue = window.location.href.substring(window.location.href.indexOf("customEvent") + 12);
                                           console.log(customValue);
                                           swa.trackCustomEvent("custom", customValue);
                                           }
                                     
                                           var oSideNavigation = this.byId('sideNavigation');
                                           var bExpanded = oSideNavigation.getExpanded();
 
                                           oSideNavigation.setExpanded(!bExpanded);
                                        //    null.lengh();
                                        //    1/0;
                             },
 
                             onHideShowSubItemPress: function () {
                                           var navListItem = this.byId('subItem3');
											
                                           navListItem.setVisible(!navListItem.getVisible());
                             },
                             enableTracking: function() {
                                           swa.enable();
                                           MessageToast.show("Tracking Enabled");
                             },
                             disableTracking: function() {
                                           swa.disable();
                                           MessageToast.show("Tracking Disabled");
                             }
              });
 
});
 