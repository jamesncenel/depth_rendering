/**
 * @file Fragment shader for anaglyph rendering
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2021/04/01
 */

/* TODO (2.4.3) Color Channel Multiplexing */

var shaderID = "fShaderAnaglyph";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */

precision mediump float;

// uv coordinates after interpolation
varying vec2 textureCoords;

// Texture map for the left eye
uniform sampler2D textureMapL;

// Texture map for the right eye
uniform sampler2D textureMapR;

void main() {
	vec4 LColor = texture2D( textureMapL, textureCoords	);
	float leftGray = 0.2989 * LColor[0] + 0.5870 * LColor[1] + 0.1140 * LColor[2];

	vec4 RColor = texture2D( textureMapR, textureCoords );
	float rightGray = 0.2989 * RColor[0] + 0.5870 * RColor[1] + 0.1140 * RColor[2];

	gl_FragColor = vec4( leftGray, rightGray, rightGray, 1.0	);
	// Alternative Method:
	// gl_FragColor = vec4( LColor[0], RColor[1], RColor[2], 1.0	); 

}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
