var appModule = angular.module('appModule', []);

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
        $scope.loading = false;

        if ($routeParams.tag){
            $scope.tag = $routeParams.tag;
            $scope.loading = true;
            $scope.photos = false;
            $http.post('/flickrapi', { tag: $routeParams.tag })
                .success(function(data){
                    $scope.loading = false;
                    $scope.photos = data;
                 })
              }

            $scope.requestTwoPhotos = function(){
                $scope.photos = false;
                $scope.loading = true;
                $http.post('/flickrapi', { tag: $scope.tag || $routeParams.tag })
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

}]);

appModule.directive('map', function() {
    return {
        restrict: 'E',
        replace: true,
        template: '<div></div>',
        link: function(scope, element, attrs) {
            var map = L.map(attrs.id, {
                center: [33, 31],
                zoom: 2

            });
            //create a CloudMade tile layer and add it to the map
            L.tileLayer('http://{s}.tile.cloudmade.com/57cbb6ca8cac418dbb1a402586df4528/997/256/{z}/{x}/{y}.png', {
                maxZoom: 18
            }).addTo(map);

            function updatePoints(pts) {
               for (var p in pts) {
                  L.marker([pts[p].lat, pts[p].lng]).addTo(map).bindPopup(pts[p].message);
               }
            }

            scope.$watch(attrs.markers, function(value) {
               updatePoints(value);
            });
        }
    };
});



