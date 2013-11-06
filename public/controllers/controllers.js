var appModule = angular.module('appModule', ["leaflet-directive"]);

appModule.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/', {
            templateUrl: '/partials/home.html',
            controller: 'homeController'
        }).
        when('/map', {
            templateUrl: '/partials/map.html',
            controller: 'mapController'
        }).
        otherwise({
            redirectTo: '/'
    });
}]);

appModule
    .controller('homeController', ['$scope', '$http', 
        function ($scope, $http) {

            $scope.loading = false;

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
                    tag: $scope.tag
                }
                $http.post('/voteOnPhoto', postData)
                   .success(function(data){
                       $scope.loading = false;
                       $scope.photos = data;
                   })
            }
        }])

appModule.controller("mapController", ['$scope', '$http', function($scope, $http) {
    $scope.markers = {};

    $scope.getPhotosForMap = function(){
          $http.post('/getPhotosForMap', {tag: $scope.tag})
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



