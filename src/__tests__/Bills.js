/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"

import router from "../app/Router.js"
import Bills from "../containers/Bills.js"
import store from "../app/Store.js"

export function mockFetch(data) {
  return jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => data,
    })
  )
}

describe("Given I am connected as an employee", () => {
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
    router()
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId("icon-window"))
      const windowIcon = screen.getByTestId("icon-window")
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy()
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("And clicking on New Bill button should redirect to New Bill page", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = BillsUI({ data: bills })

      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const newBillBtn = screen.getByTestId("btn-new-bill")

      const handleClickNewBill = jest.fn(() => {
        bill.handleClickNewBill()
      })

      newBillBtn.addEventListener("click", handleClickNewBill)
      fireEvent.click(newBillBtn)

      await waitFor(() => screen.getByText("Envoyer une note de frais"))

      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })

    test("And clicking on the eye icon should open a modal with an image", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = BillsUI({ data: bills })

      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const iconEye = screen.getAllByTestId("icon-eye")[0]

      const handleClickIconEye = jest.fn(() => {
        bill.handleClickIconEye(iconEye)
      })

      iconEye.addEventListener("click", handleClickIconEye)
      fireEvent.click(iconEye)

      await waitFor(() => screen.getByText("Justificatif"))
      expect(handleClickIconEye).toHaveBeenCalled()
      expect(screen.getByText("Justificatif")).toBeTruthy()
    })

    test("getBills should return an array of bills", async () => {
      window.fetch = mockFetch(bills)

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      document.body.innerHTML = BillsUI({ data: bills })

      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      })

      await waitFor(() => screen.getByTestId("tbody"))
      const table = screen.getByTestId("tbody")

      expect(table).toBeTruthy()
      expect(table.children.length).toBeGreaterThan(0)

      const billsArray = await bill.getBills()
      expect(billsArray.length).toBeGreaterThan(0)
      expect(billsArray.length).toEqual(table.children.length)
    })
  })
})
