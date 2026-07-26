interface TeacherPortraitProps {
  src?: string;
  alt?: string;
}

export function TeacherPortrait({
  src = "/teacher-meng.png",
  alt = "孟老师",
}: TeacherPortraitProps) {
  return (
    <div className="teacher-portrait-wrap">
      <img className="teacher-portrait" src={src} alt={alt} />
    </div>
  );
}
