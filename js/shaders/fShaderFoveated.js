/**
 * @file Fragment shader for foveated rendering
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2021/04/01
 */

/* TODO (2.2.4) Fragment Shader Foveation Blur */

var shaderID = "fShaderFoveated";

var shader = document.createTextNode( `
/***
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */
precision mediump float;

// texture or uv coordinates of current fragment in normalized coordinates [0,1]
varying vec2 textureCoords;

// texture map from the first rendering pass
uniform sampler2D textureMap;

// resolution of the window in [pixels]
uniform vec2 windowSize;

// window space coordinates of gaze position in [pixels]
uniform vec2 gazePosition;

// eccentricity angle at boundary of foveal and middle layers
uniform float e1;

// eccentricity angle at boundary of middle and outer layers
uniform float e2;

// visual angle of one pixel
uniform float pixelVA;

// radius of middle layer blur kernel [in pixels]
const float middleKernelRad = 2.0;

// radius of outer layer blur kernel [in pixels]
const float outerKernelRad = 4.0;

// gaussian blur kernel for middle layer (5x5)
uniform float middleBlurKernel[int(middleKernelRad)*2+1];

// gaussian blur kernel for outer layer (9x9)
uniform float outerBlurKernel[int(outerKernelRad)*2+1];


void main() {
	
	// "2D" kernel. We have to calculate the outer product of middleBlurKernel with itself.
	float middleBlurKernel2d[25];
	// int dmidc = 0;
	for(int i = 0; i < 5; i++)
	{
		for(int j = 0; j < 5; j++)
		{
			middleBlurKernel2d[ (i*5) + j ] = middleBlurKernel[i] * middleBlurKernel[j];
			// dmidc = dmidc + 1;
		}
	}

	// "2D" kernel. We have to calculate the outer product of the outerBlurKernel with itself
	float outerBlurKernel2d[81];
	for(int i = 0; i < 9; i++)
	{
		for(int j = 0; j < 9; j++)
		{
			outerBlurKernel2d[ (i*9) + j ] = outerBlurKernel[i] * outerBlurKernel[j];
		}
	}

	// Get current fragment position in windowcoords
	vec2 currentWindowCoords = vec2(textureCoords[0] * windowSize[0], textureCoords[1] * windowSize[1]);
	float currentDistance = distance(currentWindowCoords, gazePosition);
	float currentVisualAngle = pixelVA * currentDistance;

	vec2 tempTextCoords = textureCoords;
	vec4 tempAccessColor = vec4(0.0, 0.0, 0.0, 0.0);
	vec4 blurredColor = vec4(0.0, 0.0, 0.0, 0.0);

	// Units for traversing the texture map:
	float onePixHoriz = 1.0 / windowSize[0];
	float onePixVert = 1.0 / windowSize[1];

	// Check for which region, (outer, middle, or center), our current fragment belongs to
	if(currentVisualAngle >= e2)
	{
		// Outer layer, so apply outerBlurKernel
		for(float i = 0.0; i < 9.0; i+= 1.0)
		{
			for(float j = 0.0; j < 9.0; j += 1.0)
			{
				// Coords we need in UV normalized standards
				tempTextCoords = textureCoords + vec2( (-4.0 + j) * onePixHoriz, (-4.0 + i) * onePixVert);

				// Access the color form the texture map:
				tempAccessColor = texture2D( textureMap, tempTextCoords );

				// Increment our summation for the blur
				blurredColor += outerBlurKernel2d[	int((i*9.0) + j) ] * tempAccessColor; 
			}
		}
	}
	else if(currentVisualAngle < e2 && currentVisualAngle >= e1)
	{
		// Middle layer, so apply middleBlurKernel
		for(float i = 0.0; i < 5.0; i+= 1.0)
		{
			for(float j = 0.0; j < 5.0; j += 1.0)
			{
				// Coords we need in UV normalized standards
				tempTextCoords = textureCoords + vec2( (-2.0 + j) * onePixHoriz, (-2.0 + i) * onePixVert);

				// Access the color form the texture map:
				tempAccessColor = texture2D( textureMap, tempTextCoords );

				// Increment our summation for the blur
				blurredColor += middleBlurKernel2d[	int((i*5.0) + j) ] * tempAccessColor; 
			}
		}
	}
	else{
		blurredColor = texture2D( textureMap, textureCoords	);
	}

	// Setting the last number to 1.0.
	// blurredColor[3] = 1.0;
	// gl_FragColor = texture2D( textureMap,  textureCoords );
	gl_FragColor = blurredColor;

}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
