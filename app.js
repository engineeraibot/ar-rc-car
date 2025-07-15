import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { ARButton } from 'https://unpkg.com/three@0.126.1/examples/jsm/webxr/ARButton.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const light = new THREE.AmbientLight( 0xffffff, 1 );
scene.add( light );

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;
document.body.appendChild( renderer.domElement );

document.body.appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );

function createCar() {
	const car = new THREE.Group();

	const body = new THREE.Mesh(
		new THREE.BoxGeometry( 1, 0.4, 2 ),
		new THREE.MeshStandardMaterial( { color: 0xff0000 } )
	);
	car.add( body );

	const wheel_fr = new THREE.Mesh(
		new THREE.CylinderGeometry( 0.2, 0.2, 0.1, 32 ),
		new THREE.MeshStandardMaterial( { color: 0x000000 } )
	);
	wheel_fr.position.set( 0.6, -0.1, 0.7 );
	wheel_fr.rotation.z = Math.PI / 2;
	car.add( wheel_fr );

	const wheel_fl = new THREE.Mesh(
		new THREE.CylinderGeometry( 0.2, 0.2, 0.1, 32 ),
		new THREE.MeshStandardMaterial( { color: 0x000000 } )
	);
	wheel_fl.position.set( -0.6, -0.1, 0.7 );
	wheel_fl.rotation.z = Math.PI / 2;
	car.add( wheel_fl );

	const wheel_br = new THREE.Mesh(
		new THREE.CylinderGeometry( 0.2, 0.2, 0.1, 32 ),
		new THREE.MeshStandardMaterial( { color: 0x000000 } )
	);
	wheel_br.position.set( 0.6, -0.1, -0.7 );
	wheel_br.rotation.z = Math.PI / 2;
	car.add( wheel_br );

	const wheel_bl = new THREE.Mesh(
		new THREE.CylinderGeometry( 0.2, 0.2, 0.1, 32 ),
		new THREE.MeshStandardMaterial( { color: 0x000000 } )
	);
	wheel_bl.position.set( -0.6, -0.1, -0.7 );
	wheel_bl.rotation.z = Math.PI / 2;
	car.add( wheel_bl );

	return car;
}

const car = createCar();
car.visible = false;
scene.add( car );

const reticle = new THREE.Mesh(
	new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
	new THREE.MeshBasicMaterial()
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add( reticle );

let hitTestSource = null;
let hitTestSourceRequested = false;

function onSelect() {
	if ( reticle.visible ) {
		car.position.setFromMatrixPosition( reticle.matrix );
		car.visible = true;
	}
}

const controller = renderer.xr.getController( 0 );
controller.addEventListener( 'select', onSelect );
scene.add( controller );

window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

const keys = {};
document.addEventListener( 'keydown', ( event ) => {
	keys[ event.code ] = true;
} );
document.addEventListener( 'keyup', ( event ) => {
	keys[ event.code ] = false;
} );

const speed = 0.01;
const turnSpeed = 0.01;

renderer.setAnimationLoop( function ( timestamp, frame ) {

	if ( keys[ 'ArrowUp' ] ) {
		car.position.z -= Math.cos( car.rotation.y ) * speed;
		car.position.x -= Math.sin( car.rotation.y ) * speed;
	}
	if ( keys[ 'ArrowDown' ] ) {
		car.position.z += Math.cos( car.rotation.y ) * speed;
		car.position.x += Math.sin( car.rotation.y ) * speed;
	}
	if ( keys[ 'ArrowLeft' ] ) {
		car.rotation.y += turnSpeed;
	}
	if ( keys[ 'ArrowRight' ] ) {
		car.rotation.y -= turnSpeed;
	}


	if ( frame ) {

		const referenceSpace = renderer.xr.getReferenceSpace();
		const session = renderer.xr.getSession();

		if ( hitTestSourceRequested === false ) {

			session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

				session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

					hitTestSource = source;

				} );

			} );

			session.addEventListener( 'end', function () {

				hitTestSourceRequested = false;
				hitTestSource = null;

			} );

			hitTestSourceRequested = true;

		}

		if ( hitTestSource ) {

			const hitTestResults = frame.getHitTestResults( hitTestSource );

			if ( hitTestResults.length ) {

				const hit = hitTestResults[ 0 ];

				reticle.visible = true;
				reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );

			} else {

				reticle.visible = false;

			}

		}

	}

	renderer.render( scene, camera );

} );
