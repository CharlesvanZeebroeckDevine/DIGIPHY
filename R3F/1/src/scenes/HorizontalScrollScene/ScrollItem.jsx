import { Image } from '@react-three/drei'

const ITEM_WIDTH = 4

const ScrollItem = ({ url, position }) => {
    return (
        <Image
            url={url}
            position={position}
            scale={[ITEM_WIDTH, 6, 1]}
            transparent
        />
    )
}

export default ScrollItem
