const NUM_BOIDS = 10;
const BOID_RADIUS = 0.25;
const WEIGHTS = {
    follow: 0.35,
    collision: 0.55,
    centering: 0.05,
    velocity: 0.01
};

var scene = new THREE.Scene();

const width = document.body.clientWidth;
const height = document.body.clientHeight - 100;

var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize(width, height);
renderer.setClearColor(0xe6ffe6);
document.body.appendChild(renderer.domElement);

var camera = new THREE.PerspectiveCamera(70, width / height);
camera.position.copy(new THREE.Vector3(0, 0, 10));

const clock = new THREE.Clock();

// Lighting
const light = new THREE.PointLight(0xffffff, 100);
light.castShadow = true;
light.position.set(1, 5, 0);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Models
const boids = new THREE.Group();
const boidGeo = new THREE.ConeGeometry(BOID_RADIUS,BOID_RADIUS* 2, 15);
const leaderGeo = new THREE.SphereGeometry(BOID_RADIUS, 15);
boidGeo.rotateX(90);
boidGeo.rotateZ(90);
const boidMat = new THREE.MeshPhongMaterial({ color: 0x3377cc });
const leaderMat = new THREE.MeshPhongMaterial({ color: 0xcc2244 });
leaderMat.shininess = 1;
const leader = new THREE.Mesh(leaderGeo, leaderMat);
leader.position.y = -5;
leader.velocity = new THREE.Vector3(0.05, 0.05, 0.05);
scene.add(leader);
leader.castShadow = true;
// const geometry = new THREE.PlaneGeometry(5, 5);
// geometry.rotateX(90);
// geometry.position.y = -5;
// Create a material object
const material = new THREE.MeshBasicMaterial({color: 0x0000ff, transparent: true, opacity: 0.5});

// Create a mesh object
// const cube = new THREE.Mesh(geometry, material);
// cube.recieveShadow = true;

// Add the cube to the scene
// scene.add(cube);
let c = 0x00ff00;
let y = 0xffff00;
let z = 0xffffff;
// Add initial boids at random locations w/ random velocities
for (let i = 0; i < NUM_BOIDS; i++) {
    c = c ^ y;
    y = y ^ z;
    const boidMat1 = boidMat.clone();
    boidMat1.color.setHex(c);
    console.log(c);
    const boidMesh = new THREE.Mesh(boidGeo, boidMat1);

    boidMesh.castShadow = true;
    boidMesh.position.x = (Math.random() > 0.5 ? -1 : 1) * 6 * Math.random();
    boidMesh.position.y = (Math.random() > 0.5 ? -1 : 1) * 6 * Math.random();
    boidMesh.velocity = new THREE.Vector3(
        Math.random(),
        Math.random(),
        Math.random()
    );
    boidMesh.name = i;
    boids.add(boidMesh);
}

scene.add(boids);

$("document").ready(() => {
    $("#following").val(WEIGHTS.follow);
    $("#followingVal").text(WEIGHTS.follow);
    $("#following").on("input", () => {
        WEIGHTS.follow = parseFloat($("#following").val());
        $("#followingVal").text(WEIGHTS.follow);
    });

    $("#collision").val(WEIGHTS.collision);
    $("#collisionVal").text(WEIGHTS.collision);
    $("#collision").on("input", () => {
        WEIGHTS.collision = parseFloat($("#collision").val());
        $("#collisionVal").text(WEIGHTS.collision);
    });

    $("#centering").val(WEIGHTS.centering);
    $("#centeringVal").text(WEIGHTS.centering);
    $("#centering").on("input", () => {
        WEIGHTS.centering = parseFloat($("#centering").val());
        $("#centeringVal").text(WEIGHTS.centering);
    });

    $("#velocity").val(WEIGHTS.velocity);
    $("#velocityVal").text(WEIGHTS.velocity);
    $("#velocity").on("input", () => {
        WEIGHTS.velocity = parseFloat($("#velocity").val());
        $("#velocityVal").text(WEIGHTS.velocity);
    });
});

function updateleader() {
    // Update the leader position
    leader.position.add(leader.velocity);
  
    // Check the leader boundaries and bounce if needed
    if (leader.position.x > 5 || leader.position.x < -5) {
      leader.velocity.x *= -1;
    }
    if (leader.position.y > 5 || leader.position.y < -5) {
      leader.velocity.y *= -1;
    }
    if (leader.position.z > 5 || leader.position.z < -5) {
      leader.velocity.z *= -1;
    }
  }
let t = 0;
let xSign = 1;
let ySign = 1;

function main() {
    function render() {
        const delta = clock.getDelta();
        // leader.position.y += ySign * 0.015;
        // leader.position.x += xSign * 0.1;
        updateleader();
        // if (leader.position.x < -6 || leader.position.x > 6) {
        //     xSign *= -1;
        // }
        // if (leader.position.y < -6 || leader.position.y > 6) {
        //     ySign *= -1;
        // }
        // if (leader.position.z > 10 || leader.position.z < -10) {
        //     leader.velocity.z *= -1;
        //   }
        for (const boid of boids.children) {
            const pathToLeader = leader.position.clone().sub(boid.position);

            const collisionVec = new THREE.Vector3();
            const flockCenter = new THREE.Vector3();
            const avgVelocity = new THREE.Vector3();
            let neighborhoodSize = 0;

            for (const other of boids.children) {
                if (boid === other) continue;
                const distance = boid.position.distanceTo(other.position);
                if (distance < BOID_RADIUS * 7 ) {
                    // within neighborhood
                    neighborhoodSize++;

                    collisionVec.add(
                        boid.position
                            .clone()
                            .sub(other.position)
                            .divideScalar(distance)
                    );
                    flockCenter.add(other.position);
                    avgVelocity.add(other.velocity);
                }
            }
            if (neighborhoodSize) {
                flockCenter.divideScalar(neighborhoodSize);
                collisionVec.divideScalar(neighborhoodSize);
                avgVelocity.divideScalar(neighborhoodSize);
            }

            const velocity = new THREE.Vector3();
            velocity.add(pathToLeader.multiplyScalar(WEIGHTS.follow));
            velocity.add(collisionVec.multiplyScalar(WEIGHTS.collision));
            velocity.add(
                flockCenter.sub(boid.position).multiplyScalar(WEIGHTS.centering)
            );
            boid.velocity = velocity;

            // Add this line to make the boid look at the direction of motion
            boid.lookAt(boid.position.clone().add(boid.velocity));

            boid.position.add(boid.velocity.multiplyScalar(delta * 3));
        }

        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    requestAnimationFrame(render);
//    requestAnimationFrame(render);
}
main();
