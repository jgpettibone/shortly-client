var shortlyApp = angular.module('shortlyApp', [
  'ngRoute', 'ngCookies'
]);

shortlyApp.config(['$routeProvider',
  function($routeProvider, $cookieStore) {
  $routeProvider.
    when('/', function(){
      if($cookieStore.get('user')){
        return {
          templateUrl: 'client/partials/listUrls.html',
          controller: 'UrlListCtrl'
        };
      } else {
        return {
          templateUrl: 'client/partials/login.html',
          controller: 'LoginCtrl'
        };
      }
    }).
    when('/create', {
      templateUrl: 'client/partials/createUrl.html',
      controller: 'UrlCreateCtrl'
    }).
    when('/login', {
      templateUrl: 'client/partials/login.html',
      controller: 'LoginCtrl'
    }).
    when('/register', {
      templateUrl: 'client/partials/register.html',
      controller: 'RegisterCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
}]);

shortlyApp.controller('UrlListCtrl', function($scope, $http) {
  $http({
    method: 'GET',
    url: '/links'
  }).then(function(obj){
    $scope.links = obj.data;
  });
  $scope.setOrderBy = function(key, reverse) {
    $scope.orderBy = key;
    $scope.reverse = !reverse;
  };
});

shortlyApp.controller('UrlCreateCtrl', function($scope, $http) {
  $scope.shorten = function(url) {
    $http({
      method: 'POST',
      url: '/links',
      data: {url: url}
    }).then(function(data){
      console.log(data);
    });
  };
});

shortlyApp.controller('LoginCtrl', function($scope, $http, $cookieStore) {
  $scope.authenticate = function(username, password) {
    $http({
      method: 'POST',
      url: '/login',
      data: {username: username, password: password}
    }).success(function(data){
      $cookieStore.put('user', data.token);
      console.log($cookieStore.get('user'));
    });
  };
});

shortlyApp.controller('RegisterCtrl', function($scope, $http, $cookieStore) {
  $scope.register = function(username, password, passwordConfirmation) {
    $http({
      method: 'POST',
      url: '/register',
      data: {username: username, password: password, passwordConfirmation: passwordConfirmation}
    }).success(function(data){
      $cookieStore.put('user', data.token);
      console.log($cookieStore.get('user'));
    });
  };
});

// shortlyApp.service('UserService', function(){
//   var currentUser;
//   var self = this;
//   this.setCurrentUser = function(user) {
//     currentUser = user;
//   };
//   this.currentUser = function() {
//     return currentUser;
//   };
// });

