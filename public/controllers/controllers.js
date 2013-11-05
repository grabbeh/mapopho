var appModule = angular.module('appModule', []);

appModule.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/', {
            templateUrl: '/partials/home.html',
            controller: 'homeController'
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



