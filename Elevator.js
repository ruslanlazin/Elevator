{
    init: function (elevators, floors) {

        var pickUpChance = 0.7;  //  This var means the probability that elevator stops to pick up pax on middle floors.
        // In different cases try value from 0.4 (usually for Speed levels) to 1.0 (usually for levels with waiting time limit).

        var isPressedUp = [];    // Index of array means number of a floor where the button was pressed.
        var isPressedDown = [];

        function ensureDirection(objElevator) {
            if (objElevator.goingUpIndicator()) {
                if (objElevator.currentFloor() >= Math.max.apply(null, objElevator.destinationQueue)) {
                    objElevator.goingUpIndicator(false);
                    objElevator.goingDownIndicator(true);
                }
            }
            if (objElevator.currentFloor() === 0) {
                objElevator.goingUpIndicator(true);
                objElevator.goingDownIndicator(false);
                //objElevator.goToFloor(floors.length - 1)  //Uncomment this line for 18th level. (Just a little spike)
            }
        }

        function SortQueue() {
            if (this.goingUpIndicator()) {
                this.destinationQueue.sort(function (a, b) {
                    return a - b;
                });
            } else {
                this.destinationQueue.sort(function (a, b) {
                    return b - a;
                });
            }
            this.checkDestinationQueue();
        }

        function callFreeElevator(floorNum) {
            for (elevatorNum = 0; elevatorNum < elevators.length; elevatorNum++) {
                if (elevators[elevatorNum].destinationQueue.length === 0) {
                    elevators[elevatorNum].goToFloor(floorNum);
                    isPressedDown[floorNum] = false;
                    break;
                }
            }
        }

        for (elavatorNumber = 0; elavatorNumber < elevators.length; elavatorNumber++) {

            elevators[elavatorNumber].goingUpIndicator(true);
            elevators[elavatorNumber].goingDownIndicator(false);

            // Whenever the elevator is idle
            elevators[elavatorNumber].on("idle", function () {
                for (floorNum = floors.length - 1; floorNum >= 0; floorNum--) {
                    if (isPressedUp[floorNum] || isPressedDown[floorNum]) {
                        this.goToFloor(floorNum);
                        isPressedUp[floorNum] = false;
                        isPressedDown[floorNum] = false;
                        break;
                    }
                }
            });

            elevators[elavatorNumber].on("floor_button_pressed", function (floorNum) {
                this.goToFloor(floorNum);
                ensureDirection(this);
                SortQueue.call(this);
            });


            elevators[elavatorNumber].on("stopped_at_floor", function (floorNum) {
                ensureDirection(this);
                SortQueue.call(this);
                if (this.goingUpIndicator()){
                    isPressedUp[floorNum]=false;
                }else{
                    isPressedDown[floorNum]=false;
                }
            });

            //Pick up pax on middle floors
            elevators[elavatorNumber].on("passing_floor", function (floorNum, direction) {
                if (direction === 'up' && isPressedUp[floorNum] && this.loadFactor() < 0.7) {
                    this.goToFloor(floorNum, true);
                    isPressedUp [floorNum] = false;

                }
                else if (direction === 'down' && isPressedDown[floorNum] && this.loadFactor() < 0.7 &&
                        Math.random() < pickUpChance) {   // Yeah man, elevator can doesn't stop for you if you aren't lucky enough.
                    this.goToFloor(floorNum, true);
                    isPressedDown [floorNum] = false;
                }
            });
        }

        // Add event of pressed button on a floor in array of pressed buttons.
        for (floorNumber = 0; floorNumber < floors.length; floorNumber++) {
            floors[floorNumber].on("down_button_pressed", function () {
                isPressedDown[this.floorNum()] = true;
                callFreeElevator(this.floorNum());
            });
            floors[floorNumber].on("up_button_pressed", function () {
                isPressedUp[this.floorNum()] = true;
            });
        }
    }
,
    update: function (dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}