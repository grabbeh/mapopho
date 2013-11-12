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
    .controller('homeController', ['$scope', '$location', '$routeParams', '$http', 
        function ($scope, $location, $routeParams, $http) {
        $scope.loading = false;
        $scope.error = false;

        if ($routeParams.tag){
            $scope.tag = $routeParams.tag;
            $scope.loading = true;
            $scope.photos = false;
            $http.post('/requestTwoPhotos', { tag: $routeParams.tag })
                .success(function(data){
                    $scope.loading = false;
                    $scope.photos = data;
                 })
                .error(function(){
                    $scope.loading = false;
                    $scope.error = true;
                 })
              }

            $scope.requestTwoPhotos = function(){
                
                if ($routeParams.tag !== $scope.tag) {
                    $scope.error = false;
                    $scope.photos = false;
                    $scope.loading = true;
                    $location.path('/show/' + $scope.tag); 
                }
                else {
                    $scope.error = false;
                    $scope.loading = true;
                    $scope.photos = false;
                    $http.post('/requestTwoPhotos', { tag: $routeParams.tag })
                        .success(function(data){
                            $scope.loading = false;
                            $scope.photos = data;
                         })
                        .error(function(){
                            $scope.loading = false;
                            $scope.error = true;
                         })
                    }
                }

            $scope.removePhoto = function(photo){
                $scope.loading = true;
                $scope.photos.forEach(function (p, i) {
                    if (photo.id === p.id) {
                        $scope.photos.splice(i, 1);
                        $http.post('/requestOnePhoto', { tag: $scope.tag || $routeParams.tag, photo:photo })
                            .success(function(data){
                                $scope.loading = false;
                                $scope.photos.push(data[0]);
                        })
                    }
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

appModule.controller("mapController", ['$scope', '$location', '$routeParams', '$http', function($scope, $location, $routeParams, $http) {
    $scope.markers = {};
    
    if ($routeParams) {
      $scope.tag = $routeParams.tag;
      $http.post('/getPhotosForMap', {tag: $routeParams.tag })
            .success(function(data){
                $scope.markers = data;
            })
            .error(function(){
                console.log("Error")
                $scope.error = true;
            })
    }

    $scope.getPhotosForMap = function(){
        $location.path('/map/' + $scope.tag)
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
                zoom: 2,
                minZoom: 1
            });
            
            L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png').addTo(map);

            var clusterer = L.markerClusterGroup();

            function updatePoints(pts) {
               for (var p in pts) {
                  var marker = L.marker([pts[p].lat, pts[p].lng]);
                  marker.bindPopup(pts[p].message, { maxWidth: 10000});
                  clusterer.addLayer(marker);
               }
            }
            map.addLayer(clusterer);

            scope.$watch(attrs.markers, function(value) {
               updatePoints(value);
            });
        }
    };
});



