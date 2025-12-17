varying vec2 vUv;
uniform float uProgress;
uniform vec2 uSize;
uniform sampler2D uTexture;
#define PI 3.1415926538


float noise(vec2 point) {
    float frequency = 1.0;
    float angle = atan(point.y,point.x) + uProgress * PI;

    float w0 = (cos(angle * frequency) + 1.0) / 2.0; // normalize [0 - 1]
    float w1 = (sin(2.*angle * frequency) + 1.0) / 2.0; // normalize [0 - 1]
    float w2 = (cos(3.*angle * frequency) + 1.0) / 2.0; // normalize [0 - 1]
    float wave = (w0 + w1 + w2) / 3.0; // normalize [0 - 1]
    return wave;
}

float softMax(float a, float b, float k) {
    return log(exp(k * a) + exp(k * b)) / k;
}

float softMin(float a, float b, float k) {
    return -softMax(-a, -b, k);
}

float circleSDF(vec2 pos, float rad) {
    float a = sin(uProgress * 0.2) * 0.25; // range -0.25 - 0.25
    float amt = 0.5 + a;
    float circle = length(pos);
    circle += noise(pos) * rad * amt;
    return circle;
}

float radialCircles(vec2 p, float o, float count) {
    vec2 offset = vec2(o, o);

    float angle = (2. * PI)/count;
    float s = round(atan(p.y, p.x)/angle);
    float an = angle * s;
    vec2 q = vec2(offset.x * cos(an), offset.y * sin(an));
    vec2 pos = p - q;
    float circle = circleSDF(pos, 15.0);
    return circle;
}

uniform vec2 uImageResolution; // Width and Height of the texture
uniform vec2 uResolution;      // Width and Height of the mesh/viewport

vec2 getCoverUv(vec2 uv, vec2 resolution, vec2 texResolution) {
    vec2 s = resolution; // Screen/Viewport
    vec2 i = texResolution; // Image
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 newUv = rs < ri ? vec2(uv.x * s.x / i.x * i.y / s.y, uv.y) : vec2(uv.x, uv.y * s.y / i.y * i.x / s.x);
    
    // Centering
    vec2 center = vec2(0.5);
    newUv = (newUv - center) + center; // This logic above usually scales around 0,0 or usage implies different centering.
    // Let's use a standard implementation:
    float newWidth = rs < ri ? s.x : s.y * ri;
    float newHeight = rs < ri ? s.x / ri : s.y;
    
    // Standard 'cover' logic for UVs [0,1]
    vec2 ratio = vec2(
        min((s.x / s.y) / (i.x / i.y), 1.0),
        min((s.y / s.x) / (i.y / i.x), 1.0)
    );
    
    return vec2(
        uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
}

void main() {
    // Calculate aspect corrected UVs
    vec2 uv = getCoverUv(vUv, uResolution, uImageResolution);

    vec4 bg = vec4(vec3(0.0), 0.0);
    vec4 texture = texture2D(uTexture, uv);
    vec2 coords = vUv * uSize;
    vec2 o1 = vec2(0.5) * uSize;

    float t = pow(uProgress, 2.5); // easing
    float radius = uSize.x / 2.0;
    float rad = t * radius;
    float c1 = circleSDF(coords - o1, rad);

    vec2 p = (vUv - 0.5) * uSize;
    float r1 = radialCircles(p, 0.2 * uSize.x, 3.0);
    float r2 = radialCircles(p, 0.25 * uSize.x, 3.0);
    float r3 = radialCircles(p, 0.45 * uSize.x, 5.0);

    float k = 50.0 / uSize.x;
    float circle = softMin(c1, r1, k); 
    circle = softMin(circle, r2, k);
    circle = softMin(circle, r3, k);

    circle = step(circle, rad);
    vec4 color = mix(bg, texture, circle);
    gl_FragColor = color;
}