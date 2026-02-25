import { genSrc } from "@/app/api";
import { Photo } from "@/app/typings";
import dayjs from "dayjs";
import { Pencil, LockOpen, LockFill, Star, StarFill, TrashBin } from "@gravity-ui/icons";
import { Button, toast } from "@heroui/react";
import { updatePhoto } from "@/app/api";

export function MobilePhotoLists({ photos, onRefresh }: { photos: Photo[], onRefresh?: () => void }) {
    return (
        <ul>
            {photos.map((photo) => (
                <li key={photo.uid}>
                    <PhotoItem photo={photo} onRefresh={onRefresh} />
                </li>
            ))}
        </ul>
    )
}

function PhotoItem({ photo, onRefresh }: { photo: Photo, onRefresh?: () => void }) {
    return (
        <div className="flex items-center gap-4 my-2">
            <div>
                <img src={genSrc(photo.src)} alt={photo.title} className="w-16 h-16 object-cover rounded" />
            </div>
            <div>
                <h3>{photo.title}</h3>
                <p>
                    <span>{dayjs(photo.shootTime).format("YYYY-MM-DD")}</span>
                    <span>{photo.author || "未知作者"}</span>
                </p>
                <section>
                    <Button isIconOnly size="sm" variant="ghost" onPress={() => {
                        updatePhoto(photo.uid, {...photo, isPublic: !photo.isPublic}).then(() => {
                            toast.success("更新成功");
                            onRefresh?.();
                        }).catch(err => {
                            toast.danger("更新失败: " + err.message);
                        });
                    }}>
                        {photo.isPublic ? <LockOpen /> : <LockFill />}
                    </Button>
                    <Button isIconOnly size="sm" variant="ghost" onPress={() => {
                        updatePhoto(photo.uid, {...photo, isSelected: !photo.isSelected}).then(() => {
                            toast.success("更新成功");
                            onRefresh?.();
                        }).catch(err => {
                            toast.danger("更新失败: " + err.message);
                        });
                    }}>
                        {photo.isSelected ? <StarFill className="text-warning" /> : <Star />}
                    </Button>
                    <Button isIconOnly size="sm" variant="ghost">
                        <Pencil className="text-accent" />
                    </Button>
                    <Button isIconOnly size="sm" variant="ghost">
                        <TrashBin className="text-danger" />
                    </Button>
                </section>
            </div>
        </div>
    )
}