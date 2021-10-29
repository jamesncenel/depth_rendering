/**
 * @file Fragment shader for DoF rendering
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2021/04/01
 */

/* TODO (2.3) DoF Rendering */

var shaderID = "fShaderDof";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */
precision mediump float;

// uv coordinates after interpolation
varying vec2 textureCoords;

// texture map from the first rendering
uniform sampler2D textureMap;

// depth map from the first rendering
uniform sampler2D depthMap;

// Projection matrix used for the first pass
uniform mat4 projectionMat;

// Inverse of projectionMat
uniform mat4 invProjectionMat;

// resolution of the window in [pixels]
uniform vec2 windowSize;

// Gaze position in [pixels]
uniform vec2 gazePosition;

// Diameter of pupil in [mm]
uniform float pupilDiameter;

// pixel pitch in [mm]
uniform float pixelPitch;

const float searchRad = 11.0;


// Compute the distance to fragment in [mm]
// p: texture coordinate of a fragment / a gaze position
//
// Note: GLSL is column major
float distToFrag( vec2 p ) {

	/* TODO (2.3.1) Distance to Fragment */
	float firstElemBottom = projectionMat[2][2]; // 3rd column, 3rd row
	float secondElemTop  = projectionMat[3][2]; // 4th column, 3rd row
	
	// Getting NDC Z
	float ndcZ = texture2D(	depthMap, p	)[0];

	// Getting wClip
	float wClip = secondElemTop * (1.0 / ndcZ +  firstElemBottom);
	// float wClip = secondElemTop / (ndcZ +  firstElemBottom); -->Squashed bug

	// wClip = -1.0 * zCamera, so,
	float trueDepth = -1.0 * wClip;

	return trueDepth;

}


// compute the circle of confusion in [mm]
// fragDist: distance to current fragment in [mm]
// focusDist: distance to focus plane in [mm]
float computeCoC( float fragDist, float focusDist ) {

	/* TODO (2.3.2) Circle of Confusion Computation */
	
	// Calc Magnification:
	float focalDEye = 17.0;
	float magnifi = (focalDEye) / (focusDist - focalDEye);

	// Other part needed:
	float fractionElem = abs(fragDist - focusDist) / fragDist;
	
	// Putting it all together:
	float circleDiam = magnifi * pupilDiameter * fractionElem;

	return circleDiam;
}


// compute depth of field blur and return color at current fragment
vec3 computeBlur() {
	/* TODO (2.3.3) Retinal Blur */

	// Get actual distance of current fragment:
	float currentFragmentDistance = distToFrag(textureCoords);	

	// Get the depth of the gaze position:
	vec2 uvGaze = vec2(gazePosition[0] / windowSize[0], gazePosition[1] / windowSize[1]);
	float gazeDepth = distToFrag(uvGaze);

	// Getting the circle of confusion for the current frag
	float ccDiam = computeCoC( currentFragmentDistance, gazeDepth );

	vec2 currentWindowCoords = vec2(textureCoords[0] * windowSize[0], textureCoords[1] * windowSize[1]);
	float onePixHoriz = 1.0 / windowSize[0];
	float onePixVert = 1.0 / windowSize[1];

	vec2 tempTextCoords = textureCoords;
	vec2 tempWindowCoords = currentWindowCoords;
	vec4 tempAccessColor = vec4(0.0, 0.0, 0.0, 0.0);
	vec4 blurredColor = vec4(0.0, 0.0, 0.0, 0.0);

	float checkDistance = 0.0;

	float circleDiamInPixels = ccDiam / pixelPitch;
	float circleRadInPixels = circleDiamInPixels / 2.0;

	float avgCounter = 0.0;

	for(float i = 0.0; i < searchRad; i++)
	{
		for(float j = 0.0; j < searchRad; j++)
		{
			// Coords we need in UV normalized standards
			tempTextCoords = textureCoords + vec2( (-5.0 + j) * onePixHoriz, (-5.0 + i) * onePixVert);

			// Access the color form the texture map:
			tempAccessColor = texture2D( textureMap, tempTextCoords );

			// Convert them to window coords:
			tempWindowCoords = vec2(tempTextCoords[0] * windowSize[0], tempTextCoords[1] * windowSize[1]);

			// Calc the distance between this fragment and our current fragment in pixels
			checkDistance = distance(tempWindowCoords, currentWindowCoords);

			// Add the color if the pixel we are on falls into the current fragment's circle of confusion:
			// Circle of confusion = diameter in mm
			if(checkDistance <= circleRadInPixels)
			{
				blurredColor += tempAccessColor;
				avgCounter += 1.0;
			}
		}
	}
	// Take the average
	vec4 avgBlurredColor = vec4( blurredColor[0]/avgCounter, blurredColor[1]/avgCounter, blurredColor[2]/avgCounter, blurredColor[3]/avgCounter	);

	return vec3( avgBlurredColor[0], avgBlurredColor[1], avgBlurredColor[2] );
}


void main() {
	vec3 computedBlur = computeBlur();
	vec4 homogeneousBlur = vec4(computeBlur(), 1.0);

	gl_FragColor = homogeneousBlur;
}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
