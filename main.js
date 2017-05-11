/** CONSTANTS **/

    const CARRYING = '1';

/** MAIN **/

    function main() {

        // Read the amount of busters you control
        let bustersPerPlayer = parseInt(readline());
        
        // Read the amount of ghosts on the map
        let ghostCount = parseInt(readline()); 
        
        // Read my team id. If this is 0, your base is on the top left of the map,
        // if it is one, on the bottom right
        let ourTeamId = parseInt(readline());

        let entities;
        let entitiesFactorie;

        // Main loop
        while (true) {

            // Reading the number of busters and ghosts visible to you
            let entitiesAmount = parseInt(readline());
            
            entitiesFactorie = new EntitiesFactorie(ourTeamId);

            for (let i = 0; i < entitiesAmount; i++) {
                let inputs = readline().split(' ');
                entitiesFactorie.addEntitie(inputs);
            }

            entities = entitiesFactorie.getEntities();

            printErr('Found:');
            printErr(entities.busters.length + ' busters');
            printErr(entities.ghosts.length + ' ghosts');
            printErr(entities.bastards.length + ' bastards');

            for (let i = 0; i < entities.busters.length; i++) {

                entities.busters[i].act(entities);

            }

        }

    }

    main();

/** CLASSES **/

    /** ENTITIE **/
        function Entitie(rawEntitie) {

            this.entities = null;

            // Buster id or ghost id, can be similar numbers
            this.id = parseInt(rawEntitie[0]);

            // Position of this buster / ghost
            this.position = {};
            this.position.x = parseInt(rawEntitie[1]);
            this.position.y = parseInt(rawEntitie[2]);

            // Team id if it is a buster, -1 if it is a ghost
            this.type = parseInt(rawEntitie[3]);

            // For busters: 0 = idle, 1 = carrying a ghost.
            // For ghosts, it is always 0
            this.state = parseInt(rawEntitie[4]);

            // For busters: Ghost id being carried.
            // For ghosts: number of busters attempting to trap this ghost
            this.value = parseInt(rawEntitie[5]);

        }

    /** BUSTER **/
        function Buster(rawEntitie, ourTeamId) {

            Entitie.call(this, rawEntitie);

            this.homeCoordinates = {};
            this.homeCoordinates.x = (ourTeamId === '0') ? 0 : 16000;
            this.homeCoordinates.y = (ourTeamId === '0') ? 0 : 9000;

        }

        extend(Buster, Entitie);

        Buster.prototype.act = function(entities) {
            
            this.entities = entities;

            if(this.state == CARRYING) {
                this.carryHome();
            } else {
                this.hunt();
            }

        }

        Buster.prototype.hunt = function() {

            // If there is some ghosts visible...
            if(this.entities.ghosts.length > 0) {

                let target = null;

                // ...and any of them is in range of catch from this buster...
                this.entities.ghosts.some((index, ghost) => {

                    let distance = distanceBetween(this.position, ghost.position);

                    if(distance <= 2200) {
                        target = ghost;
                        target.distance = distance;
                        return true;
                    }

                });

                if(target.distance < 900 || target.distance > 1760) {
                    this.adjust(target);
                } else {
                    this.bust(target);
                }
            }

        }

        Buster.prototype.carryHome = function() {

            let distanceToHome = distanceBetween(this.position, this.homeCoordinates);

            if(distanceToHome > 1550) {
                
                let distanceToHomeBorder = distanceToHome - 1500;
                let homeDirection = directionFromVector(this.position, this.homeCoordinates);
                let newPosition = {
                    x: this.x + homeCoordinates * distanceToHomeBorder,
                    y: this.y + homeCoordinates * distanceToHomeBorder
                };

                print('MOVE ' + newPosition.x + ' ' + newPosition.y);

            } else {
                print('RELEASE');
            }

        }

        Buster.prototype.adjust = function(target) {
            let targetCurentPosition = target.position;

            // You have 2 poins A and B,
            // you need to find poin C, that lie on vector AB,
            // in direction from A to B, and C is on distance d from B:
            // 1). Find vector AB - subtract from end point start point
            // 2). Find vector AB length - squar root of sum of squar of vectors values
            // 3). Find unit vector AB - divide vector on it's length
            // 4). Multiply unit vector on d
            // 5). Set start of final vector in point B

            let direction = directionFromVector(this.position, targetCurentPosition);

            let finalVector = {
                x: direction.x * 400,
                y: direction.y * 400
            };

            let targetPossibleNewPosition = {
                x: finalVector.x + targetCurentPosition.x,
                y: finalVector.y + targetCurentPosition.y
            };

            let newPossibleDistance = distanceBetween(this.position, targetPossibleNewPosition);

            let adjustment = 0;

            if(newPossibleDistance > 1760) {
                adjustment = newPossibleDistance - 1760 + 50;
            } else if(newPossibleDistance < 900) {
                adjustment = 900 - newPossibleDistance + 50;
            }

            let newPosition = {
                x: this.position.x + direction * adjustment,
                y: this.position.y + direction * adjustment
            };

            print('MOVE ' + newPosition.x + ' ' + newPosition.y);

        }

        Buster.prototype.bust = function(target) {
            print('BUST ' + target.id);
        }

    /** GHOST **/
        function Ghost(rawEntitie) {
            Entitie.apply(this, arguments);
        }

        extend(Ghost, Entitie);

    /** BASTARD **/
        function Bastard(rawEntitie) {
            Entitie.apply(this, arguments);
        }

        extend(Bastard, Entitie);

    /** EntitieFactory **/
        function EntitiesFactorie(ourTeamId) {

            this.ourTeamId = ourTeamId + '';

            this.entities = {};
            this.entities.busters = [];
            this.entities.ghosts = [];
            this.entities.bastards = [];

        }

        EntitiesFactorie.prototype.addEntitie = function(rawEntitie) {
            switch(rawEntitie[3]) {
                case -1:
                    this.entities.ghosts.push(new Ghost(rawEntitie));
                    break;

                case this.ourTeamId:
                    this.entities.busters.push(new Buster(rawEntitie, this.ourTeamId));
                    break;

                default:
                    this.entities.bastards.push(new Bastard(rawEntitie));
                    break;
            }
        }

        EntitiesFactorie.prototype.getEntities = function() {
            return this.entities;
        }

/** UTILS **/

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function extend(Child, Parent) {
        Child.prototype = Object.create(Parent.prototype);
        Child.prototype.constructor = Child;
    }

    function distanceBetween(a, b) {
        return Math.round(Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)));
    }

    function directionFromVector(start, end) {

        let vector = {
            x: end.x - start.x,
            y: end.y - start.y
        };

        let vectorLength = distanceBetween(end, start);

        let unitVector = {
            x: vector.x / vectorLength,
            y: vector.y / vectorLength
        };

        return unitVector;
    }

