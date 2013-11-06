var appModule = angular.module('appModule', ["leaflet-directive"]);

appModule.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/show', {
            templateUrl: '/partials/home.html',
            controller: 'homeController'
        }).
        when('/show/:tag', {
            templateUrl: '/partials/home.html',
            controller: 'homeController'
        }).
        when('/map', {
            templateUrl: '/partials/map.html',
            controller: 'mapController'
        }).
        when('/map/:tag', {
            templateUrl: '/partials/map.html',
            controller: 'mapController'
        }).
        otherwise({
            redirectTo: '/'
    });
}]);

appModule
    .controller('homeController', ['$scope', '$routeParams', '$http', 
        function ($scope, $routeParams, $http) {

        if ($routeParams){
                $scope.photos = false;
                $scope.loading = true;
                $http.post('/flickrapi', { tag: $routeParams.tag })
                   .success(function(data){
                      $scope.loading = false;
                      $scope.photos = data;
                   })
                }

            $scope.requestTwoPhotos = function(){
                $scope.photos = false;
                $scope.loading = true;
                $http.post('/flickrapi', { tag: $scope.tag })
                   .success(function(data){
                      $scope.loading = false;
                      $scope.photos = data;
                })
            }

            $scope.voteOnPhoto = function(photo){
                $scope.photos = false;
                $scope.loading = true;
                var postData = {
                    photo: photo,
                    tag: $scope.tag || $routeParams.tag
                }
                $http.post('/voteOnPhoto', postData)
                   .success(function(data){
                       $scope.loading = false;
                       $scope.photos = data;
                   })
            }
        }])

appModule.controller("mapController", ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http) {
    $scope.markers = {};

    if ($routeParams) {
      $http.post('/getPhotosForMap', {tag: $routeParams.tag })
            .success(function(data){
                $scope.markers = data;
            })
    }

    $scope.getPhotosForMap = function(){
          $http.post('/getPhotosForMap', {tag: $scope.tag })
            .success(function(data){
                $scope.markers = data;
            })
          }

    angular.extend($scope, {
        center: {
            lat: 33.380999,
            lng: 31.289063,
            zoom: 2
        },
        defaults: {
            scrollWheelZoom: false
        }
    });
}]);





