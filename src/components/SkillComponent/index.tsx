interface SkillComponentProps {
  level: number;
  name: string;
}

export const SkillComponent = ({
  level = 1,
  name = "",
}: SkillComponentProps) => {
  return (
    <div className="skill-container">
      <p className="skill-name">{name}</p>
      <div className="skill-indicator-container">
        <div className="skill-indicator">
          <div
            className="level-filled"
            style={{ width: `${(100 / 5) * level}%` }}
          />
        </div>
        <p className="skill-level">{level}</p>
      </div>
    </div>
  );
};
