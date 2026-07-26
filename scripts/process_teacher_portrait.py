from PIL import Image

SRC = r"C:\Users\meng\.cursor\projects\d-Projects-gaokao-volunteer\assets\c__Users_meng_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_1eb0755655fa1ff09d0d2c55a6918d72-145147b3-f758-473f-a5a3-b5ab7641d2c4.png"
OUT = r"D:\Projects\gaokao-volunteer\public\teacher-meng.png"


def remove_blue_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            is_blue_bg = (
                blue > 90
                and blue > red + 15
                and blue > green + 5
                and red < 160
                and green < 185
            )
            is_light_blue = (
                blue > 75
                and blue > red + 8
                and green > 55
                and green < 195
                and red < 140
            )
            if is_blue_bg or is_light_blue:
                pixels[x, y] = (red, green, blue, 0)

    return rgba


def find_opaque_bbox(image: Image.Image, alpha_threshold: int = 24):
    pixels = image.load()
    width, height = image.size
    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > alpha_threshold:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    return min_x, min_y, max_x, max_y


def main() -> None:
    image = Image.open(SRC)
    cutout = remove_blue_background(image)
    min_x, min_y, max_x, max_y = find_opaque_bbox(cutout)

    person_height = max_y - min_y
    person_width = max_x - min_x

    # 去掉头发上方留白：从头顶再往下收 1%
    top = max(0, min_y + int(person_height * 0.01))
    # 去掉胸口以下：保留到人物高度约 68%（领带下方、胸口位置）
    bottom = min(cutout.height, min_y + int(person_height * 0.68))
    # 左右保留少量肩宽
    side_pad = max(6, int(person_width * 0.03))
    left = max(0, min_x - side_pad)
    right = min(cutout.width, max_x + side_pad)

    cropped = cutout.crop((left, top, right, bottom))
    cropped.save(OUT, "PNG")
    print(f"saved: {OUT}")
    print(f"size: {cropped.size}")


if __name__ == "__main__":
    main()
