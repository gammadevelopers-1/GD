import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "gd-website";

export function Sizes() {
  return (
    <div className="bg-background flex items-center gap-4 p-10">
      <Avatar size="sm">
        <AvatarFallback>AM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>RK</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>TS</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function WithBadge() {
  return (
    <div className="bg-background flex items-center gap-4 p-10">
      <Avatar>
        <AvatarFallback>AM</AvatarFallback>
        <AvatarBadge />
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>RK</AvatarFallback>
        <AvatarBadge />
      </Avatar>
    </div>
  );
}

export function ProjectRoster() {
  return (
    <div className="bg-background p-10">
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>RK</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>TS</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>
    </div>
  );
}
