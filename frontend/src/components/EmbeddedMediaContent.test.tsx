import { render, screen } from "@testing-library/react";
import EmbeddedMediaContent from "./EmbeddedMediaContent";
import { normalizeContentMedia } from "./ContentMediaGallery";

describe("content media", () => {
  it("normalizes Google Drive share links into embeddable image URLs", () => {
    expect(normalizeContentMedia([
      "https://drive.google.com/file/d/example-file-id/view?usp=sharing",
    ])).toEqual([
      {
        url: "https://drive.google.com/uc?export=view&id=example-file-id",
        kind: "image",
      },
    ]);
  });

  it("places a side image at its marker and keeps the following text in the reading flow", () => {
    const { container } = render(
      <EmbeddedMediaContent
        content="Introduce the graph. {{media:0}} Use the highlighted path to finish the proof."
        media={[{
          url: "/images/path.png",
          alt: "Highlighted graph path",
          kind: "diagram",
          placement: "right",
        }]}
        label="Problem visual"
      />
    );

    expect(screen.getByRole("img", { name: "Highlighted graph path" })).toHaveAttribute("src", "/images/path.png");
    expect(screen.getByText(/Use the highlighted path to finish the proof/)).toBeInTheDocument();
    expect(container.querySelector(".md\\:flex-row")).toBeInTheDocument();
  });

  it("keeps a malformed marker visible and renders unused images after the text", () => {
    render(
      <EmbeddedMediaContent
        content="See {{media:3}} for a visual."
        media={[{ url: "/images/only.png", alt: "Only visual" }]}
      />
    );

    expect(screen.getByText(/\{\{media:3\}\}/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Only visual" })).toBeInTheDocument();
  });
});
