import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

// import Chart from 'chart.js';

require('/imports/language')('Dashboard');

import './dashboard.html';

let dashboard = {
  show: function () {
    $('.ui.dimmer.prepare').fadeOut(300);  
    $('.ui.panel.main, .ui.panel.board').show();
  },
  hide: function () {
    $('.ui.dimmer.prepare').fadeOut(300);  
    $('.ui.panel.main, .ui.panel.board').show();
  }
}


Template.Dashboard.onCreated(function(){
  dashboard.hide();
});


Template.Dashboard.onRendered(() => {
  $('.user-menu > .item').removeClass('selected');
  $('.user-menu > .item.home').addClass('selected');

  let username = FlowRouter.getParam('username');


    // T.Call('getDashboardProfile', 'dvgamer').then(function(data){
      // if(data.length) {
        dashboard.show();
        $('.ui.panel.sign-in').hide();
      // } else {

      // }
    // });
});