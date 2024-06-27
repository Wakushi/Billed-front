/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router"

// Replace real store with mock store module when found
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an Employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock })
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.com",
      })
    )
    document.body.innerHTML = `
      <div id="root"></div>
    `

    // router() fills the DOM with the template matching the current pathname
    // + it instantiate the component class associated with the current pathname
    router()
  })

  describe("When I am on NewBill Page", () => {
    test("Then, the form and file input should be rendered correctly", () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
    })

    test("And I upload a file with an incorrect format, an alert should be shown and file input should be cleared", () => {
      window.onNavigate(ROUTES_PATH.NewBill)
      window.alert = jest.fn()

      const fileInput = screen.getByTestId("file")
      const file = new File(["test"], "test.txt", { type: "text/plain" })

      fireEvent.change(fileInput, {
        target: { files: [file] },
      })

      expect(window.alert).toHaveBeenCalledWith(
        "Le format du fichier n'est pas valide"
      )
      expect(fileInput.value).toBe("")
    })

    test("And I upload a file with a correct format, the file should be accepted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)

      const fileInput = screen.getByTestId("file")
      const file = new File(["test"], "test.png", { type: "image/png" })

      fireEvent.change(fileInput, {
        target: { files: [file] },
      })

      await waitFor(() => expect(fileInput.files[0].name).toBe("test.png"))
    })

    test("And I submit the form with valid data, the new bill should be created and I should be redirected to the Bills page", async () => {
      window.onNavigate(ROUTES_PATH.NewBill)

      const form = screen.getByTestId("form-new-bill")

      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transport" },
      })
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Test Expense" },
      })
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "100" },
      })
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2022-12-31" },
      })
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } })
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } })
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: "Test commentary" },
      })

      fireEvent.submit(form)

      await waitFor(() =>
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      )
    })
  })
})
